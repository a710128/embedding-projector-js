/**
 * @license
 * The MIT License (MIT)
 * Copyright (c) 2015 Waylon Flinn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.weblas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var globals = require('./lib/globals'),
    pipeline = require("./lib/pipeline"),
    SGEMMCalculator = require("./lib/sgemmcalculator"),
    SAXPYCalculator = require("./lib/saxpycalculator"),
    SSCALCalculator = require("./lib/sscalcalculator"),
    SDWNSCalculator = require("./lib/sdwnscalculator"),
    SCLMPCalculator = require("./lib/sclmpcalculator"),
    test = require("./lib/test");

var gl = globals.gl,
    sgemmcalculator = new SGEMMCalculator(gl),
    saxpycalculator = new SAXPYCalculator(gl),
    sscalcalculator = new SSCALCalculator(gl),
    sdwnscalculator = new SDWNSCalculator(gl),
    sclmpcalculator = new SCLMPCalculator(gl);

module.exports = {
    // level one
    "saxpy" : saxpy,
    "sscal" : sscal,   // single precision matrix scale
    // level two
    // level three
    "sgemm" : sgemm,   // single precision generalized matrix multiply
    // extra
    "sstd" : sstd,     // single precision Standard Score normalization
    "sdwns": sdwns,
    "sclmp": sclmp,
    // pipeline
    "pipeline" : pipeline,
    // internals
    "gpu" : {	"gl": gl,
                    "sgemm": pipeline.sgemmcalculator.calculate.bind(pipeline.sgemmcalculator),
                "sscal" : pipeline.sscalcalculator.calculate.bind(pipeline.sscalcalculator),
                "sclmp" : pipeline.sclmpcalculator.calculate.bind(pipeline.sclmpcalculator),
                "sdwns" : pipeline.sdwnscalculator.calculate.bind(pipeline.sdwnscalculator),
                "encode" : gl.encode.bind(gl)
            },
    "util" : { "fromArray" : fromArray, "transpose" : transpose},
    "test" : test
};


/* Wrap the GL calculation object in a (relatively) user friendly function that
    accepts TypedArrays

    * convert the data to (padded) textures in GPU memory
    * execute calculation
    * read result into an array, and return
    */
function sgemm(M, N, K, alpha, A, B, beta, C){

    if(C != null && C.length != N){
        throw new Error("Only vector C with length matching rows in A is currently supported.");
    }

    // pack each matrix into a single RGBA texel array, with the second transposed
    var texels0 = A,
        texels1,
        texels2 = C;


    texels1 = transpose(K, N, B);

    // create input textures from data
    var texture0 = gl.createDataTexture(M, K, texels0);
    var texture1 = gl.createDataTexture(N, K, texels1);
    var texture2 = null;
    if(texels2 != null){
        texture2 = gl.createDataTexture(1, N, texels2);
    }

    var texture3 = gl.createOutputTexture(M, N);

    sgemmcalculator.calculate(M, N, K, alpha, texture0, texture1, beta, texture2, texture3);

    // retrieve data
    rawBuffer = gl.readData(M, N);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture1);
    if(texture2 != null){
        gl.context.deleteTexture(texture2);
    }
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);

}

function saxpy(N, a, X, Y){

    var rawBuffer;


    var texels0 = X,
        texels1;

    // TODO: special shader for constant Y
    if(isFloat32Array(Y)){
        texels1 = Y;
    } else {
        texels1 = new Float32Array(N);
        texels1.fill(Y);
    }

    // create input textures from data
    var texture0 = gl.createDataTexture(1, N, texels0);
    var texture1 = gl.createDataTexture(1, N, texels1);

    var texture3 = gl.createOutputTexture(1, N);

    saxpycalculator.calculate(N, a, texture0, texture1, texture3);

    // retrieve data
    rawBuffer = gl.readData(1, N);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture1);
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);

}

function isFloat32Array(obj){
    return Object.prototype.toString.call(obj) === "[object Float32Array]";
}
/* a more general version of the BLAS Level 1 scale, that works on matrices
    and includes an elementwise scalar addition

    a * X + b

    a - multiplicative scalar
    b - additive scalar
    X - matrix (M x N)

    to get the standard BLAS scal set M = 1 and b = 0

    this function is generally only cost effective to use in a pipeline
*/
function sscal(M, N, a, b, X){

    var rawBuffer;

    var texels0 = X;
    var texture0 = gl.createDataTexture(M, N, texels0);

    var texture3 = gl.createOutputTexture(M, N);

    sscalcalculator.calculate(M, N, a, b, texture0, texture3);

    // retrieve data
    rawBuffer = gl.readData(M, N);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);
}

/* Calculate the Standard Score normalization (subtract mean
    ,divide by standard deviation).
    */
function sstd(M, N, mu, sigma, X){

    var rawBuffer;

    var texels0 = X;
    var texture0 = gl.createDataTexture(M, N, texels0);

    var texture3 = gl.createOutputTexture(M, N);

    // adjust the parameters (for inverse) and call the standard score normalization
    sscalcalculator.calculate(M, N, 1.0/sigma, -1.0 * mu/sigma, texture0, texture3);

    // retrieve data
    rawBuffer = gl.readData(M, N);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);
}

/* downsample an image (taking the max) for Pooling

    M - rows in input
    N - columns in input
    c - channels in input
    factor - the downsample factor (width of patch to sample)
    stride - width between pooling regions
    X - input image
    */
function sdwns(M, N, channels, factor, stride, X){


    var texels0 = X;

    var texture0 = gl.createDataTexture(M, N * channels, X);

    var N_out = Math.floor((N - factor) / stride) + 1;
    var M_out = Math.floor((M - factor) / stride) + 1;

    var texture3 = gl.createOutputTexture(M_out, N_out * channels);

    sdwnscalculator.calculate(M, N, channels, factor, stride, texture0, texture3);

    // retrieve data
    rawBuffer = gl.readData(M_out, N_out * channels);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);
}
/*  Elementwise clamp function for matrices on the interval [a, b]. Can also be
    used for min or max, by passing Number.MIN_VALUE for the first parameter and
    Number.MAX_VALUE for the second parameter, respectively.

    Passing `null` for either of these parameters will default to it's
    respective min or max value.

    M - number of rows in X
    N - number of columns in X
    a - lower bound (inclusize)
    b - upper bound (inclusive)
    X - matrix

    to get the standard BLAS scal set M = 1 and b = 0

    this function is generally only cost effective to use in a pipeline
*/
function sclmp(M, N, a, b, X){

    a = (a != null) ? a : Number.MIN_VALUE;
    b = (b != null) ? b : Number.MAX_VALUE;

    var rawBuffer;

    var texels0 = X;
    var texture0 = gl.createDataTexture(M, N, texels0);

    var texture3 = gl.createOutputTexture(M, N);

    sclmpcalculator.calculate(M, N, a, b, texture0, texture3);

    // retrieve data
    rawBuffer = gl.readData(M, N);

    // clean up
    gl.context.deleteTexture(texture0);
    gl.context.deleteTexture(texture3);

    // return result
    return new Float32Array(rawBuffer);
}
/*
function saxpy(n, a, x, y){
    var i = 0,
        result = new Float32Array(n);

    // assert n = x.length
    // assert a is scalar
    // assert x is Float32Array

    if(isNumeric(y)){
        // shortcut for scalar y
        for(; i < n; i++){
            result[i] = a * x[i] + y;
        }
    } else {

        for(; i < n; i++){
            result[i] = a * x[i] + y[i];
        }
    }

    return result;

}*/

// add a String.format method, if none exists
if (!String.prototype.format) {
    String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
    };
}

function isNumeric( obj ) { return (obj - parseFloat( obj ) + 1) >= 0; }

/* create a typed array from a 2D javascript array */
function fromArray(array, type, tranpose) {
    var shape = [],
            data,
            c;   // number of columns

    if(!tranpose){
        shape[0] = array.length;
        shape[1] = array[0].length;
    } else {
        shape[1] = array.length;
        shape[0] = array[0].length;
    }
    c = shape[1];

    type = type || Float32Array;

    data = new type(shape[0]*shape[1]);

    for (var ii = 0; ii < shape[0]; ++ii)
        for (var jj = 0; jj < shape[1]; ++jj)
        if(!tranpose)
            data[ii*c + jj] = array[ii][jj];
        else
            data[ii*c + jj] = array[jj][ii];

    return data;
};

// tranpose a typed array in row major order, with the given row and column
// numers
function transpose(r, c, typedArray){
    var result = new typedArray.constructor(r*c);

    for(var i = 0; i < r; i++){
        for(var j = 0; j < c; j++){
            result[j * r + i] = typedArray[i * c + j];
        }
    }

    return result;
}

},{"./lib/globals":2,"./lib/pipeline":3,"./lib/saxpycalculator":4,"./lib/sclmpcalculator":5,"./lib/sdwnscalculator":6,"./lib/sgemmcalculator":7,"./lib/sscalcalculator":9,"./lib/test":11}],2:[function(require,module,exports){
var WebGL = require("./webgl");

var gl = new WebGL();

module.exports = {
    "gl" : gl
}

},{"./webgl":12}],3:[function(require,module,exports){
var globals = require('./globals'),
    SGEMMCalculator = require("./sgemmcalculator"),
    SAXPYCalculator = require("./saxpycalculator"),
    SSCALCalculator = require("./sscalcalculator"),
    SDWNSCalculator = require("./sdwnscalculator"),
    SCLMPCalculator = require("./sclmpcalculator"),
    SLOKNCalculator = require("./slokncalculator"),
    Tensor = require('./tensor');


var gl = globals.gl,
    sgemmcalculator = new SGEMMCalculator(gl, false),
    saxpycalculator = new SAXPYCalculator(gl, false),
    sscalcalculator = new SSCALCalculator(gl, false),
    sdwnscalculator = new SDWNSCalculator(gl, false),
    sclmpcalculator = new SCLMPCalculator(gl, false),
    slokncalculator = new SLOKNCalculator(gl, false);

module.exports = {
    "Tensor" : Tensor,
    "sscal" : sscal,
    "sgemm" : sgemm,
    "sdwns" : sdwns,
    "sclmp" : sclmp,
    "slokn" : slokn,

    "sgemmcalculator" : sgemmcalculator,
    "saxpycalculator" : saxpycalculator,
    "sscalcalculator" : sscalcalculator,
    "sdwnscalculator" : sdwnscalculator,
    "sclmpcalculator" : sclmpcalculator,
    "slokncalculator" : slokncalculator
}

/* scale (and optionally offset) a Tensor, elementwise
    */
function sscal(a, b, t0){

    var M = t0.shape[0],
        N = t0.shape[1];

    // create an empty output Tensor
    var tOut = new Tensor([M, N], null);

    sscalcalculator.calculate(M, N, a, b, t0.texture, tOut.texture);

    return tOut;
}

/* matrix multiply on t0 and t1 with additive t2. t1 must be transposed
    */
function sgemm(alpha, t0, t1, beta, t2){

    if(t1.shape[1] !== t0.shape[1])
        throw new Error("Second dimension must be of same size for input Tensors (second Tensor is transposed).");

    var M = t0.shape[0],
        N = t1.shape[0],
        K = t0.shape[1];

    var texture2;

    if(t2){
        texture2 = t2.texture;
    } else {
        texture2 = null;
    }

    // create an empty output Tensor
    var tOut = new Tensor([M, N], null);

    sgemmcalculator.calculate(M, N, K, alpha, t0.texture, t1.texture, beta, texture2, tOut.texture);

    return tOut;
}

function sdwns(channels, factor, stride, t0){

    if(t0.shape[1] % channels !== 0)
        throw new Error("Second dimension of tensor must be a multiple of channels");

    var M = t0.shape[0],
        N = t0.shape[1] / channels;

    var M_out = Math.floor((M - factor) / stride) + 1;
    var N_out = Math.floor((N - factor) / stride) + 1;

    // create an empty output Tensor
    var tOut = new Tensor([M_out, N_out * channels], null);

    sdwnscalculator.calculate(M, N, channels, factor, stride, t0.texture, tOut.texture);

    return tOut;
}

function sclmp(a, b, t0){

    a = (a != null) ? a : Number.MIN_VALUE;
    b = (b != null) ? b : Number.MAX_VALUE;

    var M = t0.shape[0],
        N = t0.shape[1];

    // create an empty output Tensor
    var tOut = new Tensor([M, N], null);

    sclmpcalculator.calculate(M, N, a, b, t0.texture, tOut.texture);

    return tOut;
}

/* Linearize onto Kernels, Transform input into one row per patch, for use in
    convolution.

    channels - number of channels in the input
    factor - width (and height) of kernels (and patches)
    stride - number of elements between patches
    t0 - the input Tensor
    */
function slokn(channels, factor, stride, margin, t0){

    if(t0.shape[1] % channels !== 0)
        throw new Error("Second dimension of tensor must be a multiple of channels");

    var M = t0.shape[0],
        N = t0.shape[1] / channels;

    var N_p, M_p;

    // number of patches (columns and rows)
    if(!margin){
        margin = 0;
        N_p = Math.ceil((N - factor) / stride) + 1;
        M_p = Math.ceil((M - factor) / stride) + 1;
    } else {
        N_p = Math.ceil((N + (2 * margin) - factor) / stride) + 1;
        M_p = Math.ceil((M + (2 * margin) - factor) / stride) + 1;
    }

    var P_p = factor * factor * channels; // elements per kernel
    var M_out = (M_p * N_p),
            N_out = P_p;

    // create an empty output Tensor
    var tOut = new Tensor([M_out, N_out], null);

    slokncalculator.calculate(M, N, channels, M_out, N_out, N_p, factor, stride, margin, t0.texture, tOut.texture);

    return tOut;
}

},{"./globals":2,"./saxpycalculator":4,"./sclmpcalculator":5,"./sdwnscalculator":6,"./sgemmcalculator":7,"./slokncalculator":8,"./sscalcalculator":9,"./tensor":10}],4:[function(require,module,exports){
var WebGL = require('./webgl');

/* A calculator object for the Float texture based AXPY

    a times X plus Y (AXPY):

    Y = a * X + Y

    where X + Y is elementwise matrix addition


    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function SAXPYCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = standalone || true; // default to standalone mode


    var s = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded A\nuniform sampler2D Y;\t\t// texture with data from padded transpose of B\nuniform int       N;\nuniform float     a; \t\t// coefficient to multiplication\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1540259130(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1604150559(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n \tfloat row = outTex.y;\n\tfloat col = outTex.x;\n\n\t// direct usage of col requires output be padded exactly like input\n\tvec4 x = texture2D( X, vec2(col, row));\n\tvec4 y = texture2D( Y, vec2(col, row));\n\tvec4 sum_v = (a * x) + y;\n\tint channel = int(mod(col * float(N), 4.0 ));\n\tfloat sum = select_index_1604150559(sum_v, channel);\n\n\tif (sum == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n \t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1540259130(sum);\n}\n";
    //	p = glslify('./glsl/saxpy/pipeline.glsl');

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program = this.webgl.createProgram(s);
    } else {
        this.program = this.webgl.createProgram(p);
    }
}

module.exports = SAXPYCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
SAXPYCalculator.TEXTURE_UNIFORM_NAME_0 = "X";
SAXPYCalculator.TEXTURE_UNIFORM_NAME_1 = "Y";
SAXPYCalculator.LENGTH_UNIFORM_NAME = "N";
SAXPYCalculator.COEFFICIENT_UNIFORM_NAME = "a";


/* Calculate the AXPY, with the given data.

    N - number of elements in X and Y
    a - scalar coefficient to X
    X - left hand vector (texture)
    Y - right hand vector (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    */
SAXPYCalculator.prototype.calculate = function(N, a, X, Y, out){

    var gl = this.webgl.context;

    /*
    var h1 = M, w1 = K,
        h2 = K, w2 = N;
    */

    this.webgl.selectProgram(this.program);

    // create and bind our input texture using matrix data
    this.bindInputTexture(X, gl.TEXTURE0, SAXPYCalculator.TEXTURE_UNIFORM_NAME_0);
    this.bindInputTexture(Y, gl.TEXTURE1, SAXPYCalculator.TEXTURE_UNIFORM_NAME_1);


    var pad = this.webgl.getPad(N);
    // set the data specific variables in our shader program
    this.bindUniforms(N + pad, a);

    // create our destination texture
    this.webgl.bindOutputTexture(1, N + pad, out);


    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);
    this.webgl.unbindInputTexture(gl.TEXTURE1);

};

/* Create a texture from the given texel data and bind it to our shader program.

    h - number of rows in input matrix
    w - number of cols in input matrix
    texels - packed data
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
SAXPYCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/* Set up inputs for the texture shader

    */
SAXPYCalculator.prototype.bindUniforms = function(N, a) {
    var gl = this.webgl.context;

    // get var locations
    var N_gl = gl.getUniformLocation(this.program, SAXPYCalculator.LENGTH_UNIFORM_NAME),
        a_gl = gl.getUniformLocation(this.program, SAXPYCalculator.COEFFICIENT_UNIFORM_NAME);

    // bind length of shared dimension
    gl.uniform1i(N_gl, N);
    gl.uniform1f(a_gl, a);

};

},{"./webgl":12}],5:[function(require,module,exports){
var WebGL = require('./webgl');

/*  Elementwise clamp function for matrices on the interval [a, b]. Can also be
    used for min or max, by passing Number.MIN_VALUE for the first parameter and
    Number.MAX_VALUE for the second parameter, respectively.

    Passing `null` for either of these parameters will default to it's
    respective min or max value.

    max(a, min(b, x)) for each x in X

    where X is a matrix, a and b are scalars


    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function SCLMPCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = (standalone != null) ? standalone : true; // default to standalone mode

    var s = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded A\nuniform int       N;\t\t// number of columns\nuniform int       pad;\t\t// additional columns to nearest multiple of four\nuniform float     a; \t\t// lower bound\nuniform float     b; \t\t// upper bound\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1604150559(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1540259130(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row = outTex.y;\n\tfloat col = outTex.x;\n\n\t// return 0.0 if in padded region of output texture\n\tif(col * float(N + pad) > float(N) ) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n\t// direct usage of col requires output be padded exactly like input\n\tvec4 x = texture2D( X, vec2(col, row));\n\tvec4 val = clamp(x, a, b);\n\n\t// select and output channel (standalone version only)\n\tint channel = int(mod(col * float(N + pad), 4.0));\n\tfloat sum = select_index_1540259130(val, channel);\n\n\tif (sum == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n\t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1604150559(sum);\n}\n",
        p = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded A\nuniform int       N;\t\t// number of columns\nuniform int       pad;\t\t// additional columns to nearest multiple of four\nuniform float     a; \t\t// lower bound\nuniform float     b; \t\t// upper bound\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1540259130(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tfloat col = (col_t * float(N + pad) - 2.0); // index of first element in pixel (matrix space)\n\n\t// direct usage of col requires output be padded exactly like input\n\tvec4 x = texture2D( X, vec2(col_t, row_t));\n\tvec4 val_v = clamp(x, a, b);\n\n\t// is last element in pixel past row length?\n\tif(pad > 0 && (col + 4.0) > float(N) ) {\n\t\t// fix elements in padded region\n\t\tfix_pad_1540259130(val_v, pad);\n\t}\n\n\tgl_FragColor = val_v;\n}\n";

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program = this.webgl.createProgram(s);
    } else {
        this.program = this.webgl.createProgram(p);
    }
}

module.exports = SCLMPCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
SCLMPCalculator.TEXTURE_UNIFORM_NAME_0 = "X";
SCLMPCalculator.LENGTH_UNIFORM_NAME = "N";
SCLMPCalculator.LOWER_UNIFORM_NAME = "a";
SCLMPCalculator.UPPER_UNIFORM_NAME = "b";


/* Elementwise clamp a matrix to the interval [a, b]

    M - number of rows in X
    N - number of columns in X
    a - lower bound (inclusize)
    b - upper bound (inclusive)
    X - matrix (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    */
SCLMPCalculator.prototype.calculate = function(M, N, a, b, X, out){

    a = (a != null) ? a : Number.MIN_VALUE;
    b = (b != null) ? b : Number.MAX_VALUE;

    var gl = this.webgl.context;

    this.webgl.selectProgram(this.program);

    // create and bind our input texture using matrix data
    this.bindInputTexture(X, gl.TEXTURE0, SCLMPCalculator.TEXTURE_UNIFORM_NAME_0);

    var nPad = this.webgl.getPad(N);
    // set the data specific variables in our shader program
    this.bindUniforms(N, nPad, a, b);

    // create our destination texture
    if(this.standalone){
        this.webgl.bindOutputTexture(M, N + nPad, out);
    } else {
        this.webgl.bindOutputTexture(M, (N + nPad)/ 4, out);
    }

    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);

};

/* Create a texture from the given texel data and bind it to our shader program.

    h - number of rows in input matrix
    w - number of cols in input matrix
    texels - packed data
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
SCLMPCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/* Set up inputs for the texture shader

    */
SCLMPCalculator.prototype.bindUniforms = function(N, pad, a, b) {
    var gl = this.webgl.context;

    // get var locations
    var N_gl = gl.getUniformLocation(this.program, SCLMPCalculator.LENGTH_UNIFORM_NAME),
        b_gl = gl.getUniformLocation(this.program, SCLMPCalculator.UPPER_UNIFORM_NAME),
        a_gl = gl.getUniformLocation(this.program, SCLMPCalculator.LOWER_UNIFORM_NAME),
        pad_gl = gl.getUniformLocation(this.program, "pad");

    // bind length of shared dimension
    gl.uniform1i(N_gl, N);
    gl.uniform1i(pad_gl, pad);
    gl.uniform1f(a_gl, a);
    gl.uniform1f(b_gl, b);

};

},{"./webgl":12}],6:[function(require,module,exports){
var WebGL = require('./webgl');

/*  Downsample an image (useful in pooling layers).



    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function DownsampleCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = (standalone != null) ? standalone : true; // default to standalone mode

    var s = "// TODO: unroll loop for stride == factor and small values (2, 3)\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;  // texture coords of row/column to calculate\nuniform sampler2D X;       // texture with data from padded A\nuniform int       factor;  // width of image patch\nuniform float     stride;  // width between image patches\nuniform float     C;       // number of channels\nuniform float     M;\nuniform float     N;\nuniform float     N_out;\nuniform float     M_out;\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1540259130(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1604150559(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate and translate to output pixel space.\n\tfloat row = floor(outTex.y * M_out);   // row on output texture (matrix space)\n\tfloat col = floor(outTex.x * N_out); // column on output texture (matrix space)\n\tfloat vcol = floor(col / C);   // virtual column on output texture (matrix space)\n\tfloat vchannel = floor(mod(col, C)); // virtual channel on output texture\n\n\tconst float min = -1.0e+08;\n\tvec4 currentMax = vec4(min, min, min, min);\n\n\tfloat deltaY = 1.0/M;\n\tfloat deltaX = 1.0/N;\n\tfloat y = ((row * stride) + 0.5)*deltaY; // texture position of input row\n\tfloat x;\n\tfloat z = vchannel * deltaX;\n\tfor (int i = 0; i < 100; i += 1) {\n\t\tif (i >= factor) {\n\t\t\tbreak;\n\t\t}\n\t\tx = ((vcol * stride * C) + 0.5) * deltaX; // texture position of input column\n\n\t\tfor (int j = 0; j < 100; j += 1) {\n\t\t\tif (j >= factor) {\n\t\t\t\tbreak;\n\t\t\t}\n\n\t\t\tvec2 coords = vec2(x + z, y);\n\t\t\tvec4 x_v = texture2D(X, coords);\n\t\t\tcurrentMax = max(currentMax, x_v);\n\n\t\t\tx += (deltaX * C);\n\t\t}\n\t\ty += deltaY;\n\t}\n\tint chan = int(mod(outTex.x * N_out, 4.0 ));\n\tfloat val = select_index_1604150559(currentMax, int(chan));\n\tif (val == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n\tgl_FragColor = encode_float_1540259130(val);\n}\n";
        p = "// TODO: unroll loop for stride == factor and small values (2, 3)\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;  // texture coords of row/column to calculate\nuniform sampler2D X;       // texture with data from padded A\nuniform int       factor;  // width of image patch\nuniform float     stride;  // width between image patches\nuniform float     C;       // number of channels\nuniform float     M;\nuniform float     N;\nuniform float     N_out;\nuniform float     M_out;\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate and translate to output pixel space.\n\tfloat row = floor(outTex.y * M_out);   // row on output texture (pixel space)\n\tfloat col = floor(outTex.x * N_out); // column on output texture (matrix space)\n\tfloat vcol = floor(col / C);   // virtual column on output texture (matrix space)\n\tfloat vchannel = floor(mod(col, C)); // virtual channel on output texture\n\n\tconst float min = -1.0e+08;\n\tvec4 currentMax = vec4(min, min, min, min);\n\n\tfloat deltaY = 1.0/M;\n\tfloat deltaX = 1.0/N;\n\tfloat y = ((row * stride) + 0.5)*deltaY; // texture position of input row\n\tfloat x;\n\tfloat z = vchannel * deltaX;\n\tfor (int i = 0; i < 100; i += 1) {\n\t\tif (i >= factor) {\n\t\t\tbreak;\n\t\t}\n\t\tx = ((vcol * stride * C) + 0.5) * deltaX; // texture position of input column\n\n\t\tfor (int j = 0; j < 100; j += 1) {\n\t\t\tif (j >= factor) {\n\t\t\t\tbreak;\n\t\t\t}\n\n\t\t\tvec2 coords = vec2(x + z, y);\n\t\t\tvec4 x_v = texture2D(X, coords);\n\t\t\tcurrentMax = max(currentMax, x_v);\n\n\t\t\tx += (deltaX * C);\n\t\t}\n\t\ty += deltaY;\n\t}\n\n\tgl_FragColor = currentMax;\n}\n";

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program = this.webgl.createProgram(s);
    } else {
        this.program = this.webgl.createProgram(p);
    }
}

module.exports = DownsampleCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
DownsampleCalculator.TEXTURE_UNIFORM_NAME_0 = "X";
DownsampleCalculator.INPUT_ROW_COUNT_UNIFORM_NAME = "M";
DownsampleCalculator.INPUT_COLUMN_COUNT_UNIFORM_NAME = "N";
DownsampleCalculator.OUTPUT_ROW_COUNT_UNIFORM_NAME = "M_out";
DownsampleCalculator.OUTPUT_COLUMN_COUNT_UNIFORM_NAME = "N_out";
DownsampleCalculator.FACTOR_UNIFORM_NAME = "factor";
DownsampleCalculator.STRIDE_UNIFORM_NAME = "stride";
DownsampleCalculator.CHANNEL_COUNT_UNIFORM_NAME = "C";


/* Downsample (pool) the input using the maximum for each channel.

    M - rows in X
    N - columns in X
    c - (channels / 4) in X
    factor - the number of pixels (width and height) to combine
    stride - amount between groups of pixels
    X - input matrix (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    */
DownsampleCalculator.prototype.calculate = function(M, N, channels, factor, stride, X, out){

    if(channels % WebGL.COMPONENTS_PER_TEXEL != 0){
        throw new Error("Channel count must be a multiple of " + WebGL.COMPONENTS_PER_TEXEL);
    }
    var gl = this.webgl.context;

    var N_out = (Math.floor((N - factor) / stride) + 1) * channels;
    var M_out = Math.floor((M - factor) / stride) + 1;

    this.webgl.selectProgram(this.program);

    // create and bind our input texture using matrix data
    this.bindInputTexture(X, gl.TEXTURE0, DownsampleCalculator.TEXTURE_UNIFORM_NAME_0);


    // set the data specific variables in our shader program
    this.bindUniforms(M, N * channels, M_out, N_out, factor, stride, channels);

    // create our destination texture
    if(this.standalone){
        this.webgl.bindOutputTexture(M_out, N_out, out);
    } else {
        this.webgl.bindOutputTexture(M_out, N_out/WebGL.COMPONENTS_PER_TEXEL, out);
    }


    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);

};

/* Create a texture from the given texel data and bind it to our shader program.

    texture - texture containing input values to bind
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
DownsampleCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/* Set up inputs for the texture shader

    */
DownsampleCalculator.prototype.bindUniforms = function(M, N, M_out, N_out, factor, stride, c) {
    var gl = this.webgl.context;

    // get var locations
    var M_gl = gl.getUniformLocation(this.program, DownsampleCalculator.INPUT_ROW_COUNT_UNIFORM_NAME),
        N_gl = gl.getUniformLocation(this.program, DownsampleCalculator.INPUT_COLUMN_COUNT_UNIFORM_NAME),
        M_out_gl = gl.getUniformLocation(this.program, DownsampleCalculator.OUTPUT_ROW_COUNT_UNIFORM_NAME),
        N_out_gl = gl.getUniformLocation(this.program, DownsampleCalculator.OUTPUT_COLUMN_COUNT_UNIFORM_NAME),
        factor_gl = gl.getUniformLocation(this.program, DownsampleCalculator.FACTOR_UNIFORM_NAME),
        stride_gl = gl.getUniformLocation(this.program, DownsampleCalculator.STRIDE_UNIFORM_NAME),
        channel_count_gl = gl.getUniformLocation(this.program, DownsampleCalculator.CHANNEL_COUNT_UNIFORM_NAME);

    // bind length of shared dimension
    gl.uniform1f(M_gl, M);
    gl.uniform1f(N_gl, N);
    gl.uniform1f(M_out_gl, M_out);
    gl.uniform1f(N_out_gl, N_out);
    gl.uniform1i(factor_gl, factor);
    gl.uniform1f(stride_gl, stride);
    gl.uniform1f(channel_count_gl, c);

};

},{"./webgl":12}],7:[function(require,module,exports){
var WebGL = require('./webgl');

/* A calculator object for the Float texture based GEMM

    Generalized Matrix Multiply (GEMM):

    C = alpha * A * B + beta * C

    where A * B is matrix multiplication


    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function SGEMMCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = (standalone != null) ? standalone : true; // default to standalone mode

    // read GLSL files
    var s = "// fragment shader that calculates the matrix product and renders each\n// element to the bytes representing a 32-bit IEEE754 floating point in\n// the output RGBA canvas.\n// readPixel is used to read the bytes.\n\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform sampler2D B_t;\t\t// texture with data from padded transpose of B\nuniform int       K;\t\t// number of elements in shared dimension\nuniform int       N;\t\t// number of columns in output\nuniform int       pad;\t\t//\nuniform float     alpha; \t// coefficient to multiplication\n\n// sum of products between elements in row i (from A) x col j (from B)\n\n// Calculate the dot product between the row (from A) and column (from B)\n// identified by the passed indeces (output texture coordinate space).\n// We loop over elements in the row and column and sum the product\n// using the glsl `dot` function to process four elements at a time.\n// This four element optimization requires that the matrix B be\n// transposed before texel packing and that both matrices be padded\n// (with zeros) to a multiple of four (4) in their shared dimension.\nfloat dot_rowcol_1540259130(float y, float x, sampler2D A, sampler2D B_t, int K) {\n\tfloat delta_t = 1./float(K);// space (on texture) between elements\n\tfloat sum = 0.;\t\t\t// sum for this row/column pair\n\tfloat z = 0.5 * (4.0 * delta_t);// position for shared dimension on source textures\n\n\tfor (int l=0 ; l<4096 ; ++l) {\n\t\tif(l >= K / 4) break;    // stop when we finish the row/column\n\t\t// l is in pixel space, so we divide by four\n\n\t\t// retrieve next four elements from each texture\n\t\tvec4 a_ik = texture2D(  A, vec2(z, y));\n\t\tvec4 b_kj = texture2D(B_t, vec2(z, x));\n\n\t// use `dot` to process four elements at a time\n\t\tsum +=  dot(a_ik, b_kj);\n\t\tz += (4.0 * delta_t);      // (z + 0.5)*delta\n\t}\n\treturn sum;\n}\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1604150559(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\t// sum row x col for the passed pixel\n\tfloat sum = alpha * dot_rowcol_1540259130(row_t, col_t * float(N + pad)/float(N), A, B_t, K);\n\n\tif (sum == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n\t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1604150559(sum);\n}\n",
        s_c = "// fragment shader that calculates the matrix product (with additive 'C' term)\n// and renders each element to the bytes representing a 32-bit IEEE754 floating\n// point in the output RGBA canvas.\n// readPixel is used to read the bytes.\n\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform sampler2D B_t;\t\t// texture with data from padded transpose of B\nuniform sampler2D C;\t\t// texture with data from C\nuniform int       K;\t\t// number of elements in shared dimension\nuniform int       N;\t\t// number of columns in output\nuniform int       pad;\t\t//\nuniform float     alpha; \t// coefficient to multiplication\nuniform float     beta; \t// coefficient to additive term\n\n// sum of products between elements in row i (from A) x col j (from B)\n\n// Calculate the dot product between the row (from A) and column (from B)\n// identified by the passed indeces (output texture coordinate space).\n// We loop over elements in the row and column and sum the product\n// using the glsl `dot` function to process four elements at a time.\n// This four element optimization requires that the matrix B be\n// transposed before texel packing and that both matrices be padded\n// (with zeros) to a multiple of four (4) in their shared dimension.\nfloat dot_rowcol_1540259130(float y, float x, sampler2D A, sampler2D B_t, int K) {\n\tfloat delta_t = 1./float(K);// space (on texture) between elements\n\tfloat sum = 0.;\t\t\t// sum for this row/column pair\n\tfloat z = 0.5 * (4.0 * delta_t);// position for shared dimension on source textures\n\n\tfor (int l=0 ; l<4096 ; ++l) {\n\t\tif(l >= K / 4) break;    // stop when we finish the row/column\n\t\t// l is in pixel space, so we divide by four\n\n\t\t// retrieve next four elements from each texture\n\t\tvec4 a_ik = texture2D(  A, vec2(z, y));\n\t\tvec4 b_kj = texture2D(B_t, vec2(z, x));\n\n\t// use `dot` to process four elements at a time\n\t\tsum +=  dot(a_ik, b_kj);\n\t\tz += (4.0 * delta_t);      // (z + 0.5)*delta\n\t}\n\treturn sum;\n}\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1604150559(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1117569599(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tvec4 c_vec = texture2D(C, vec2(col_t, 0.5));\n\n\t// should be -0.5, but that subtly breaks at zero\n\tfloat col = col_t * float(N + pad); // index of first element in pixel (matrix space)\n\tint channel = int(mod(col, 4.0 ));\n\tfloat c = select_index_1117569599(c_vec, channel);\n\n\t// sum row x col for the passed pixel\n\tfloat sum = alpha * dot_rowcol_1540259130(row_t, col_t * float(N + pad)/float(N), A, B_t, K);\n\tsum += beta * c;\n\n\tif (sum == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n\t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1604150559(sum);\n}\n",
        p = "// fragment shader that calculates the matrix product and writes each\n// element to a pixel component in a floating point texture.\n// the output RGBA canvas.\n// readPixel is used to read the bytes.\n\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform sampler2D B_t;\t\t// texture with data from padded transpose of B\nuniform int       K;\t\t// number of elements in shared dimension\nuniform int       N;\t\t// number of columns in output\nuniform int       pad;\t\t//\nuniform float     alpha; \t// coefficient to multiplication\n\n// sum of products between elements in row i (from A) x col j (from B)\n\n// Calculate the dot product between the row (from A) and column (from B)\n// identified by the passed indeces (output texture coordinate space).\n// We loop over elements in the row and column and sum the product\n// using the glsl `dot` function to process four elements at a time.\n// This four element optimization requires that the matrix B be\n// transposed before texel packing and that both matrices be padded\n// (with zeros) to a multiple of four (4) in their shared dimension.\nfloat dot_rowcol_1540259130(float y, float x, sampler2D A, sampler2D B_t, int K) {\n\tfloat delta_t = 1./float(K);// space (on texture) between elements\n\tfloat sum = 0.;\t\t\t// sum for this row/column pair\n\tfloat z = 0.5 * (4.0 * delta_t);// position for shared dimension on source textures\n\n\tfor (int l=0 ; l<4096 ; ++l) {\n\t\tif(l >= K / 4) break;    // stop when we finish the row/column\n\t\t// l is in pixel space, so we divide by four\n\n\t\t// retrieve next four elements from each texture\n\t\tvec4 a_ik = texture2D(  A, vec2(z, y));\n\t\tvec4 b_kj = texture2D(B_t, vec2(z, x));\n\n\t// use `dot` to process four elements at a time\n\t\tsum +=  dot(a_ik, b_kj);\n\t\tz += (4.0 * delta_t);      // (z + 0.5)*delta\n\t}\n\treturn sum;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\tvec4 sum_v = vec4(0.0, 0.0, 0.0, 0.0);\n\tfloat col = (col_t * float(N + pad) - 2.0); // index of first element in pixel (matrix space)\n\tsum_v.r = alpha * dot_rowcol_1540259130(row_t, (col + 0.5)/float(N), A, B_t, K);\n\t// is last element in pixel past row length?\n\tif(pad > 0 && (col + 4.0) > float(N) ) {\n\t\t// compute elements in padded region\n\t\tif(pad < 3){\n\t\t\tsum_v.g = alpha * dot_rowcol_1540259130(row_t, (col + 1.5)/float(N), A, B_t, K);\n\t\t}\n\t\tif(pad < 2){\n\t\t\tsum_v.b = alpha * dot_rowcol_1540259130(row_t, (col + 2.5)/float(N), A, B_t, K);\n\t\t}\n\t} else {\n\t\tsum_v.g = alpha * dot_rowcol_1540259130(row_t, (col + 1.5)/float(N), A, B_t, K);\n\t\tsum_v.b = alpha * dot_rowcol_1540259130(row_t, (col + 2.5)/float(N), A, B_t, K);\n\t\tsum_v.a = alpha * dot_rowcol_1540259130(row_t, (col + 3.5)/float(N), A, B_t, K);\n\t}\n\n\tgl_FragColor = sum_v;\n}\n",
        p_c = "// fragment shader that calculates the matrix product and writes each\n// element to a pixel component in a floating point texture.\n// the output RGBA canvas.\n// readPixel is used to read the bytes.\n\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform sampler2D B_t;\t\t// texture with data from padded transpose of B\nuniform sampler2D C;\t\t// texture with data from C\nuniform int       K;\t\t// number of elements in shared dimension\nuniform int       N;\t\t// number of columns in output\nuniform int       pad;\t\t//\nuniform float     alpha; \t// coefficient to multiplication\nuniform float     beta; \t// coefficient to addition\n\n// sum of products between elements in row i (from A) x col j (from B)\n\n// Calculate the dot product between the row (from A) and column (from B)\n// identified by the passed indeces (output texture coordinate space).\n// We loop over elements in the row and column and sum the product\n// using the glsl `dot` function to process four elements at a time.\n// This four element optimization requires that the matrix B be\n// transposed before texel packing and that both matrices be padded\n// (with zeros) to a multiple of four (4) in their shared dimension.\nfloat dot_rowcol_1540259130(float y, float x, sampler2D A, sampler2D B_t, int K) {\n\tfloat delta_t = 1./float(K);// space (on texture) between elements\n\tfloat sum = 0.;\t\t\t// sum for this row/column pair\n\tfloat z = 0.5 * (4.0 * delta_t);// position for shared dimension on source textures\n\n\tfor (int l=0 ; l<4096 ; ++l) {\n\t\tif(l >= K / 4) break;    // stop when we finish the row/column\n\t\t// l is in pixel space, so we divide by four\n\n\t\t// retrieve next four elements from each texture\n\t\tvec4 a_ik = texture2D(  A, vec2(z, y));\n\t\tvec4 b_kj = texture2D(B_t, vec2(z, x));\n\n\t// use `dot` to process four elements at a time\n\t\tsum +=  dot(a_ik, b_kj);\n\t\tz += (4.0 * delta_t);      // (z + 0.5)*delta\n\t}\n\treturn sum;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tvec4 c_v = texture2D(C, vec2(col_t, 0.5));\n\n\tvec4 sum_v = vec4(0.0, 0.0, 0.0, 0.0);\n\tfloat col = (col_t * float(N + pad) - 2.0); // index of first element in pixel (matrix space)\n\tsum_v.r = alpha * dot_rowcol_1540259130(row_t, (col + 0.5)/float(N), A, B_t, K);\n\t// in the padding region?\n\tif(pad > 0 && (col + 4.0) > float(N) ) {\n\t\t// pad\n\t\tif(pad < 3){\n\t\t\tsum_v.g = alpha * dot_rowcol_1540259130(row_t, (col + 1.5)/float(N), A, B_t, K);\n\t\t}\n\t\tif(pad < 2){\n\t\t\tsum_v.b = alpha * dot_rowcol_1540259130(row_t, (col + 2.5)/float(N), A, B_t, K);\n\t\t}\n\t} else {\n\t\tsum_v.g = alpha * dot_rowcol_1540259130(row_t, (col + 1.5)/float(N), A, B_t, K);\n\t\tsum_v.b = alpha * dot_rowcol_1540259130(row_t, (col + 2.5)/float(N), A, B_t, K);\n\t\tsum_v.a = alpha * dot_rowcol_1540259130(row_t, (col + 3.5)/float(N), A, B_t, K);\n\t}\n\n\tgl_FragColor = sum_v + beta*c_v;\n}\n";

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program_ = this.webgl.createProgram(s);
        this.program_c = this.webgl.createProgram(s_c);
    } else {
        this.program_ = this.webgl.createProgram(p);
        this.program_c = this.webgl.createProgram(p_c);
    }

}

module.exports = SGEMMCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
SGEMMCalculator.TEXTURE_UNIFORM_NAME_0 = "A";
SGEMMCalculator.TEXTURE_UNIFORM_NAME_1 = "B_t";
SGEMMCalculator.TEXTURE_UNIFORM_NAME_2 = "C";
SGEMMCalculator.SHARED_LENGTH_UNIFORM_NAME = "K";
SGEMMCalculator.COLUMN_COUNT_UNIFORM_NAME = "N";
SGEMMCalculator.PAD_UNIFORM_NAME = "pad";
SGEMMCalculator.ALPHA_UNIFORM_NAME = "alpha";
SGEMMCalculator.BETA_UNIFORM_NAME = "beta";

/* Calculate the GEMM, with the given data.

    M - number of rows in A
    N - number of columns in B
    K - number of elements in shared dimension (including padding)
    alpha - scalar for A
    A - left hand matrix (as padded texture)
    B - transpose of right hand matrix (as padded texture)
    beta - scalar for C
    C - additive matrix (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    TODO: signature should look like this:
    ( TRANSA, TRANSB, M, N, K, ALPHA, A, LDA, B, LDB, BETA, C, LDC )
    http://www.math.utah.edu/software/lapack/lapack-blas/dgemm.html
    */
SGEMMCalculator.prototype.calculate = function(M, N, K, alpha, A, B, beta, C, out){

    var gl = this.webgl.context;

    /*
    var h1 = M, w1 = K,
        h2 = K, w2 = N;
    */

    // set this calculator program as the active program
    if(C != null){
        this.program = this.program_c;
    } else {
        beta = null;
        this.program = this.program_;
        //console.log("no C");
    }
    this.webgl.selectProgram(this.program);

    //  bind our input textures containing matrix data
    this.bindInputTexture(A, gl.TEXTURE0, SGEMMCalculator.TEXTURE_UNIFORM_NAME_0);
    this.bindInputTexture(B, gl.TEXTURE1, SGEMMCalculator.TEXTURE_UNIFORM_NAME_1);
    if(C != null){
        this.bindInputTexture(C, gl.TEXTURE2, SGEMMCalculator.TEXTURE_UNIFORM_NAME_2);
    }

    var kPad = this.webgl.getPad(K),
        nPad = this.webgl.getPad(N);

    // set the data specific variables in our shader program
    this.bindUniforms(N, K + kPad, nPad, alpha, beta);

    // create our destination texture
    if(this.standalone){
        this.webgl.bindOutputTexture(M, N + nPad, out);
    } else {
        this.webgl.bindOutputTexture(M, (N + nPad)/ 4, out);
    }

    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);
    this.webgl.unbindInputTexture(gl.TEXTURE1);
    this.webgl.unbindInputTexture(gl.TEXTURE2);

    // result can now be read with gl.readResult, or more operations can be
    // performed on destination texture (in pipeline mode)
};


/* Create a texture from the given texel data and bind it to our shader program.

    h - number of rows in input matrix
    w - number of cols in input matrix
    texels - packed data
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
SGEMMCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};


/* Set up inputs for the texture shader

    K - size of shared dimension for multiplied matrices
    */
SGEMMCalculator.prototype.bindUniforms = function(N, K, pad, alpha, beta) {
    var gl = this.webgl.context;

    // get var locations
    var K_gl	 = gl.getUniformLocation(this.program, SGEMMCalculator.SHARED_LENGTH_UNIFORM_NAME),
        alpha_gl = gl.getUniformLocation(this.program, SGEMMCalculator.ALPHA_UNIFORM_NAME),
        beta_gl = gl.getUniformLocation(this.program, SGEMMCalculator.BETA_UNIFORM_NAME),
        N_gl = gl.getUniformLocation(this.program, SGEMMCalculator.COLUMN_COUNT_UNIFORM_NAME),
        pad_gl = pad_gl = gl.getUniformLocation(this.program, SGEMMCalculator.PAD_UNIFORM_NAME);

    gl.uniform1f(beta_gl, beta);
    gl.uniform1i(N_gl, N);
    gl.uniform1i(pad_gl, pad);

    // bind length of shared dimension
    gl.uniform1i(K_gl, K);
    // bind alpha
    gl.uniform1f(alpha_gl, alpha);

};

},{"./webgl":12}],8:[function(require,module,exports){
var WebGL = require('./webgl');

/*  Linearize onto Kernels, a transformation similar to im2col, which
    transforms the input to a convolution kernel into a row.

    X - input data
    k - kernal width
    stride - number of elements between beginnings of patches


    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function SLOKNCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = (standalone != null) ? standalone : true; // default to standalone mode

    var p = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;  // texture coords of row/column to calculate\nuniform sampler2D X;       // texture with data from padded A\nuniform float     factor;  // width of image patch\nuniform float     stride;  // width between image patches\nuniform float     margin;\nuniform float     N_p;     // patches across\nuniform float     M;\nuniform float     N;\nuniform float     pad;\nuniform float     M_in;\nuniform float     N_in;\nuniform float     C;       // number of channels in input\nuniform float     pad_in;\n\n// select an element from a vector based on index\nfloat select_index_1540259130(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\n// translate a linear index into x, y coordinates for a matrix\nvec2 linear_index_coords_1604150559(float linear_index, float row_length){\n\tvec2 coords;\n\n\tcoords.x = floor(mod(linear_index + 0.5, row_length)); // column\n\tcoords.y = floor((linear_index + 0.5) / row_length); // row\n\n\treturn coords;\n}\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1117569599(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\t// row corresponds to patch\n\tfloat row = floor(row_t * M) + 0.5;\n\t// column corresponds to placement in patch\n\tfloat col_0 = floor(col_t * (N + pad) - 1.5); // index of first element in output pixel (matrix space)\n\n\t// N_p = patches across\n\tfloat col_patch = floor(mod(row, N_p)); // column index in grid of patches\n\tfloat row_patch = floor(row / N_p); // row index in grid of patches\n\tfloat col_in_0 = (col_patch * stride - margin) * C; // input column index of left element in patch\n\tfloat row_in_0 = row_patch * stride - margin; // input row index of top element in patch\n\n\tvec4 pixel_in;\n\tvec4 result = vec4(0.0, 0.0, 0.0, 0.0);\n\tvec2 coords = linear_index_coords_1604150559(col_0, factor * C); // coords inside patch\n\tvec2 ncoords;\n\tint channel_in = int(mod(col_in_0 + coords.x, 4.0));\n\tvec2 scale_in = vec2(1.0/(N_in + pad_in), 1.0/M_in); // scale from matrix to input texture coords\n\tvec2 offset_in = vec2(col_in_0 + 2.0 - float(channel_in), row_in_0 + 0.5); // offset into patch (and pixel)\n\n\tconst vec2 pixel_scale = vec2(1.0/4.0, 1.0); // scale from matrix to pixel coords\n\n\tpixel_in = texture2D(X, (coords + offset_in) * scale_in);\n\n\t// go through channels for current output pixel\n\tfor(int channel = 0; channel < 4; channel++){\n\n\t\t// are we on a new input pixel?\n\t\tncoords = linear_index_coords_1604150559(col_0 + float(channel), factor * C);\n\n\t\t// are we in the margin or outside the input texture?\n\t\tif((col_in_0 + ncoords.x + 0.5 < 0.0) || (row_in_0 + ncoords.y + 0.5 < 0.0) ||\n\t\t   (col_in_0 + ncoords.x + 0.5) > (N_in) || row_in_0 + ncoords.y + 0.5 > M_in){\n\t\t\t// yes, create a virtual pixel\n\t\t\tpixel_in = vec4(0.0, 0.0, 0.0, 0.0);\n\t\t} else if(floor(ncoords * pixel_scale) != floor(coords * pixel_scale)){\n\t\t\t// no, get the get the next real pixel\n\t\t\tcoords = ncoords;\n\t\t\toffset_in.x += float(channel_in);\n\t\t\tchannel_in = 0;\n\t\t\tpixel_in = texture2D(X, (coords + offset_in) * scale_in);\n\t\t}\n\n\t\tif(channel == 0){\n\t\t\tresult.r = select_index_1540259130(pixel_in, channel_in);\n\t\t} else if(channel == 1){\n\t\t\tresult.g = select_index_1540259130(pixel_in, channel_in);\n\t\t} else if(channel == 2){\n\t\t\tresult.b = select_index_1540259130(pixel_in, channel_in);\n\t\t} else {\n\t\t\tresult.a = select_index_1540259130(pixel_in, channel_in);\n\t\t}\n\n\t\tchannel_in++;\n\t\toffset_in.x -= 1.0;\n\t}\n\n\t// fix padded region\n\tif(pad > 0.0 && col_0 + 4.0 > N ) {\n\t\tfix_pad_1117569599(result, int(pad));\n\t}\n\n\t//gl_FragColor = vec4(row_in_0, col_in_0, channel_in, N_p);\n\tgl_FragColor = result;\n}\n";

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program = this.webgl.createProgram(s);
    } else {
        this.program = this.webgl.createProgram(p);
    }
}

module.exports = SLOKNCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
SLOKNCalculator.TEXTURE_UNIFORM_NAME_0 = "X";
SLOKNCalculator.STRIDE_UNIFORM_NAME = "stride";
SLOKNCalculator.KERNEL_WIDTH_UNIFORM_NAME = "factor";

/* Elementwise scale and offset a matrix

    M - number of rows in X
    N - number of columns in X
    a - scalar coefficient to X
    b - scalar offset of X
    X - matrix (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    */
SLOKNCalculator.prototype.calculate = function(M, N, channels, M_out, N_out, N_p, factor, stride, margin, X, out){

    var gl = this.webgl.context;

    var pad = this.webgl.getPad(N * channels),
        pad_out = this.webgl.getPad(N_out);

    this.webgl.selectProgram(this.program);

    // create and bind our input texture using matrix data
    this.bindInputTexture(X, gl.TEXTURE0, SLOKNCalculator.TEXTURE_UNIFORM_NAME_0);

    // set the data specific variables in our shader program
    this.bindUniforms(M_out, N_out, pad_out, M, N * channels, channels, pad, N_p, factor, stride, margin);

    // create our destination texture
    if(this.standalone){
        this.webgl.bindOutputTexture(M_out, N_out + pad_out, out);
    } else {
        this.webgl.bindOutputTexture(M_out, (N_out + pad_out)/ 4, out);
    }


    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);

};

/* Create a texture from the given texel data and bind it to our shader program.

    texture - texture containing the data
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
SLOKNCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/* Set up inputs for the texture shader

    */
SLOKNCalculator.prototype.bindUniforms = function(M, N, pad, M_in, N_in, channels, pad_in, N_p, factor, stride, margin) {
    var gl = this.webgl.context;

    // get var locations
    var M_gl = gl.getUniformLocation(this.program, "M"),
        N_gl = gl.getUniformLocation(this.program, "N"),
        c_gl = gl.getUniformLocation(this.program, "C"),
        M_in_gl = gl.getUniformLocation(this.program, "M_in"),
        N_in_gl = gl.getUniformLocation(this.program, "N_in"),
        stride_gl = gl.getUniformLocation(this.program, SLOKNCalculator.STRIDE_UNIFORM_NAME),
        factor_gl = gl.getUniformLocation(this.program, SLOKNCalculator.KERNEL_WIDTH_UNIFORM_NAME),
        pad_gl = gl.getUniformLocation(this.program, "pad"),
        pad_in_gl = gl.getUniformLocation(this.program, "pad_in"),
        N_p_gl = gl.getUniformLocation(this.program, "N_p");
        margin_gl = gl.getUniformLocation(this.program, "margin");

    // bind length of shared dimension
    gl.uniform1f(M_gl, M);
    gl.uniform1f(N_gl, N);
    gl.uniform1f(pad_gl, pad);
    gl.uniform1f(M_in_gl, M_in);
    gl.uniform1f(N_in_gl, N_in);
    gl.uniform1f(c_gl, channels);
    gl.uniform1f(pad_in_gl, pad_in);
    gl.uniform1f(N_p_gl, N_p);
    gl.uniform1f(factor_gl, factor);
    gl.uniform1f(stride_gl, stride);
    gl.uniform1f(margin_gl, margin);

};

},{"./webgl":12}],9:[function(require,module,exports){
var WebGL = require('./webgl');

/*  a more general version of the BLAS Level 1 scale that works on matrices
    and includes an elementwise scalar addition

    a * X + b

    where X is a matrix, a and b are scalars and operations are elementwise

    to get the standard BLAS scal set M = 1 and b = 0


    webgl - a weblas.WebGL object
    standalone - whether or not to automatically run the floating point encode
        step for rendering to an UNSIGNED_BYTE texture (this is required for
        mobile, circa 2015) but can't be used as part of a pipeline.

    * uploads and downloads data
    * executes calculation
    */
function SSCALCalculator(webgl, standalone){
    this.webgl = webgl,
    this.standalone = (standalone != null) ? standalone : true; // default to standalone mode

    var s = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded X\nuniform int       N;\t\t// number of columns\nuniform int       pad;\t\t// additional columns to nearest multiple of four\nuniform float     b; \t\t// additive term\nuniform float     a; \t\t// multiplicative term\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1540259130(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1604150559(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n \tfloat row = outTex.y;\n\tfloat col = outTex.x;\n\n\t// direct usage of col requires output be padded exactly like input\n\tvec4 x = texture2D( X, vec2(col, row));\n\tvec4 sum_v = (a * x) + b;\n\tint channel = int(mod(col * float(N + pad), 4.0 ));\n\tfloat sum = select_index_1604150559(sum_v, channel);\n\n\tif (sum == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n \t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1540259130(sum);\n}\n",
        p = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded X\nuniform int       N;\t\t// number of columns\nuniform int       pad;\t\t// additional columns to nearest multiple of four\nuniform float     b; \t\t// additive term\nuniform float     a; \t\t// multiplicative term\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1540259130(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tfloat col = (col_t * float(N + pad) - 2.0); // index of first element in pixel (matrix space)\n\n\t// direct usage of col requires output be padded exactly like input\n\tvec4 x = texture2D( X, vec2(col_t, row_t));\n\tvec4 sum_v = (a * x) + b;\n\n\t// fix padded region\n\tif(pad > 0 && col + 4.0 > float(N) ) {\n\t\tfix_pad_1540259130(sum_v, pad);\n\t}\n\n\tgl_FragColor = sum_v;\n}\n";

    // create the webgl shader program for this calculation
    // based on the specific fragment shader for this calculation
    // and the generic pass through shader
    if(this.standalone){
        this.program = this.webgl.createProgram(s);
    } else {
        this.program = this.webgl.createProgram(p);
    }
}

module.exports = SSCALCalculator;

/* Names of the uniforms (variables) used in the shader program passed in on
    each calculation.
    */
SSCALCalculator.TEXTURE_UNIFORM_NAME_0 = "X";
SSCALCalculator.LENGTH_UNIFORM_NAME = "N";
SSCALCalculator.ADD_UNIFORM_NAME = "b";
SSCALCalculator.MUL_UNIFORM_NAME = "a";

/* Elementwise scale and offset a matrix

    M - number of rows in X
    N - number of columns in X
    a - scalar coefficient to X
    b - scalar offset of X
    X - matrix (texture)
    out - output (texture)

    How this works:

    1. Activate our shader program
    2. Bind input textures
    3. Set shader program parameters
    4. Bind output texture
    5. Activate calculation with `drawElements`

    */
SSCALCalculator.prototype.calculate = function(M, N, a, b, X, out){

    var gl = this.webgl.context;

    var pad = this.webgl.getPad(N);

    this.webgl.selectProgram(this.program);

    // create and bind our input texture using matrix data
    this.bindInputTexture(X, gl.TEXTURE0, SSCALCalculator.TEXTURE_UNIFORM_NAME_0);

    // set the data specific variables in our shader program
    this.bindUniforms(N, pad, a, b);

    // create our destination texture
    if(this.standalone){
        this.webgl.bindOutputTexture(M, N + pad, out);
    } else {
        this.webgl.bindOutputTexture(M, (N + pad)/ 4, out);
    }


    // initiate calculation
    gl.drawElements(gl.TRIANGLES, /*num items*/6, gl.UNSIGNED_SHORT, 0);

    this.webgl.unbindInputTexture(gl.TEXTURE0);

};

/* Create a texture from the given texel data and bind it to our shader program.

    texture - texture containing the data
    textureUnit - the texture unit to bind to (gl.TEXTURE0, gl.TEXTURE1, etc)
    name - the uniform name to associate with (must match shader program)

    must compile program (with createProgram) first
*/
SSCALCalculator.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.webgl.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/* Set up inputs for the texture shader

    */
SSCALCalculator.prototype.bindUniforms = function(N, pad, a, b) {
    var gl = this.webgl.context;

    // get var locations
    var N_gl = gl.getUniformLocation(this.program, SSCALCalculator.LENGTH_UNIFORM_NAME),
        b_gl = gl.getUniformLocation(this.program, SSCALCalculator.ADD_UNIFORM_NAME),
        a_gl = gl.getUniformLocation(this.program, SSCALCalculator.MUL_UNIFORM_NAME),
        pad_gl = gl.getUniformLocation(this.program, "pad");

    // bind length of shared dimension
    gl.uniform1i(N_gl, N);
    gl.uniform1i(pad_gl, pad);
    gl.uniform1f(a_gl, a);
    gl.uniform1f(b_gl, b);

};

},{"./webgl":12}],10:[function(require,module,exports){
var globals = require("./globals");

var gl = globals.gl;

function Tensor(shape, data){
    if(shape.length != 2)
        throw new Error("Only Tensor of order two (matrix) is supported right now.");

    var M = shape[0],
        N = shape[1];

    this.texture = gl.createDataTexture(M, N, data);

    this.shape = [M, N];
}

module.exports = Tensor;

Tensor.prototype.delete = function(){
    gl.context.deleteTexture(this.texture);
    this.texture = null;
    this.shape = null;
};

Tensor.prototype.transfer = function(keep){

    var M = this.shape[0],
        N = this.shape[1],
        out,
        result;

    // create output texture
    out = gl.createOutputTexture(M, N);

    // float extraction
    gl.encode(M, N, this.texture, out);

    result = new Float32Array(gl.readData(M, N));

    // clean up
    gl.context.deleteTexture(out);

    if(!keep){
        this.delete();
    }

    return result;
};

Tensor.prototype.reshape = function(shape, keep){

    var M = this.shape[0],
        N = this.shape[1],
        M_out = shape[0],
        N_out = shape[1];

    // create new texture to hold tranpose
    var t0 = new Tensor(shape, null);

    // invoke shader
    gl.reshape(M, N, M_out, N_out, this.texture, t0.texture);

    if(!keep){
        this.delete();
    }

    return t0;
};

Tensor.prototype.transpose = function(keep){

    var M = this.shape[0],
        N = this.shape[1];

    // create new texture to hold tranpose
    var tT = new Tensor([N, M], null);

    // invoke shader
    gl.transpose(M, N, this.texture, tT.texture);

    if(!keep){
        this.delete();
    }

    return tT;
};

Tensor.prototype.split = function(stride, keep){

    var M = this.shape[0],
        N = this.shape[1];

    if(N % 2 !== 0)
        throw new Error("row count must be multiple of two.");


    // create new texture to hold tranpose
    var t0 = new Tensor([M, N/2], null),
        t1 = new Tensor([M, N/2], null);

    gl.submatrix(N, M, N/2, stride, 0, this.texture, t0.texture);
    gl.submatrix(N, M, N/2, stride, 1, this.texture, t1.texture);

    if(!keep){
        this.delete();
    }

    return [t0, t1];
}

Tensor.combine = function(t0, t1, stride, keep){

    var M = t0.shape[0],
        N = t0.shape[1];

    if(t0.shape[1] !== t1.shape[1] || t0.shape[0] !== t1.shape[0])
        throw new Error("row and column counts must be equal.");

    if(stride % 4 !== 0)
        throw new Error("stride must be a multiple of four");

    // create new texture to hold tranpose
    var t2 = new Tensor([M, N * 2], null);

    gl.combine(M, N, stride, t0.texture, t1.texture, t2.texture);

    if(!keep){
        t0.delete();
        t1.delete();
    }

    return t2;
}

},{"./globals":2}],11:[function(require,module,exports){
var async = require('async'),
    loader = require('arrayloader'); // browserify aware file loader (xhr in browser)

/* Collection of helper methods for testing numerical computation
    */
test = {};

/* Check all entries in two TypedArrays of identical length for approximate
    equality.
    If the following equation is element-wise true, returns true

    absolute(a - b) <= (atol + rtol * absolute(b))

    from numpy.allclose
    */
test.allclose = function(a, b, RTOL, ATOL){
    RTOL= RTOL || 1e-05;  // for 32 bit precision: 1e-06
    ATOL= ATOL || 1e-08;

    if(a.length != b.length){
        console.log("lengths not equal: " + a.length + ", " + b.length);
        return {"result" : false, "index": null};
    }

    var result;
    for(var i = 0; i < a.length; i++){

        result = Math.abs(a[i] - b[i]) <= ATOL + RTOL * Math.abs(b[i]);

        if(!result) {
            return {"result": false, "index": i};
        }
    }

    return {"result": true, "index": i};
};

test.randomArray = function(N, M){

    var data = [];

    for(var i = 0; i < N; i++){
        var row = [];
        for(var j = 0; j < M; j++){
            row[j] = Math.random() / Math.sqrt(N);
        }
        data.push(row);
    }

    return data;
};
// pad rows with zeros
test.padData = function(M, N, pad, data){

    var padded = new Float32Array(M * (N + pad)); // new array of specified length filled with zeros
    for(var i = 0; i < M; i++){
        padded.set(data.subarray(i * N, (i + 1) * N), i * (N + pad));
    }
    return padded;
};

test.submatrix = function(N, M, N_out, offset, data){
    var result = new data.constructor(M * N_out);

    for(var i = 0; i < M; i++){
        for(var j = 0; j < N_out; j++){
            result[i * N_out + j] = data[i * N + j + offset];
        }
    }

    return result;
};


function loadFloat32Array(path, cb){
    return loader.load(path, Float32Array, cb);
}

/* Load test matrices from JSON data, works in a browser (with XHR)
    assumes three files 'a.json', 'b.json' and 'c.json' in nested Array format.

    callback = function(err, a, b, c)
    */
test.load = function(testDirectory, matrixFiles, callback){

    // array of paths to matrix data files for current test
    var testFiles = matrixFiles.map(function(item){ return testDirectory + item;});

    //console.log(testFiles);
    async.map(testFiles, loadFloat32Array,
        function(err, results){

            if(err) return callback(err);

            callback(err, results);
        }
    );
};

test.assert = {};

/* create a tape compatible assert */
test.assert.allclose = function(t, a, b, msg, RTOL, ATOL) {

    var ok = test.allclose(a, b, RTOL, ATOL),
        actual = "[",
        expected = "[";

    if(!ok.result){

        if(ok.index > 1){
            actual += "..., ";
            expected += "..., ";
        }
        if(ok.index > 0){
            actual += a[ok.index - 1] + ", ";
            expected += b[ok.index - 1] + ", ";
        }
        actual += "-->";
        expected += "-->";

        for(var i = ok.index; i < ok.index + 4 && i < a.length; i++ ){
            actual += a[i] + ", ";
            expected += b[i] + ", ";
        }
        if(i < a.length){
            actual += "...]";
            expected += "...]";
        } else {
            actual += "]";
            expected += "]";
        }
        msg = msg || 'should be allclose at ' + ok.index;
    }

    t._assert(ok.result, {
        message : msg || 'should be allclose',
        operator : 'allclose',
        actual : actual,
        expected : expected,
        extra : null
    });
}

module.exports = test;

},{"arrayloader":13,"async":14}],12:[function(require,module,exports){

/**
 * @license
 * Copyright (c) 2015 Waylon Flinn
 *
 * webgl.js
 *
 * multiply matrices up to 4096 x 4096 on GPUs that support OES_texture_float
 * extension. input is encoded into the red and green channels of an input texture and
 * calculations are done using a custom fragment shader.
 */


/*
    A WebGL context associated with a specific canvas element.

    * creates a canvas
    * sets up webgl context
    * translates numbers into textures
    * compiles shader programs for executing math (when supplied with an
        operation specific fragment shader)
    */
function WebGL(options) {

    var glOptions,
        ext;

    options = options || {};

    // canvas
    if(typeof options.canvas === 'undefined')
        this.canvas = document.createElement('canvas');
    else
        this.canvas = options.canvas;

    // context
    glOptions = { premultipliedAlpha: false, preserveDrawingBuffer: false };
    this.context = this.canvas.getContext("experimental-webgl", glOptions);

    if (this.context == null) {
        // No support for Webgl.
        return;
    }

    // float texture extension
    try {
        ext = this.context.getExtension('OES_texture_float');
    } catch(e) {

    }
    if ( !ext ) {
        console.log("No support for OES_texture_float extension.");
        this.hasFloat = false;
    } else {
        this.hasFloat = true;
    }

    var highp = this.context.getShaderPrecisionFormat(this.context.FRAGMENT_SHADER, this.context.HIGH_FLOAT);
    this.hasHighPrecision = highp.precision != 0;
    if(this.hasHighPrecision) this.highp = highp;

    // create pass through vertex shader
    var passThrough = "// vertex shader for a single quad\n// work is performed in the operation specific texture shader\n\nprecision highp float;\n#define GLSLIFY 1\n\nattribute vec3 pos;\nattribute vec2 tex;\nvarying vec2   outTex;\nvoid main(void)\n{\n\t// just pass the position and texture coords\n\tgl_Position = vec4(pos, 1.0);\n\toutTex = tex;\n}\n";
    this.vertexShader = this.context.createShader(this.context.VERTEX_SHADER);
    this.context.shaderSource(this.vertexShader, passThrough);
    this.context.compileShader(this.vertexShader);

    var encode = "\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform int       N;\t\t// number of columns in output\nuniform int       pad;\t\t//\n\n// Render float to bytes according to IEEE 754 Floating Point\nvec4 encode_float_1540259130(float val) {\n\n\t// TODO: correctly handle denormal numbers\n\t// http://www.2ality.com/2012/04/number-encoding.html\n\tfloat a = abs(val);                           // encode absolute value + sign\n\tfloat exp = floor(log2(a));                 // number of powers of 2\n\tfloat mant = pow(2.,log2(a)-exp) * pow(2.,23.);  // multiply to fill 24 bits (implied leading 1)\n\tfloat mant1 = floor(mant / 256. / 256.);    // first 8 bits of mantissa\n\tfloat mant2 = mod(floor(mant / 256.),256.); // second 8 bits\n\tfloat mant3 = mod(mant,256.);               // third 8 bits\n\n\thighp float sign = 128.-128.*(a/val);\t\t\t// sign bit is 256 or 0\n\thighp float e = (sign+exp+127.)/510.;\t\t// exponent and sign\n\thighp float m1 = (mant1-(128.*(1.-mod(exp+127.,2.))))/255.; // handle leading bit\n\thighp float m2 = (mant2)/255.;\t\t\t\t// middle part\n\thighp float m3 = (mant3+.5)/255.;\t\t\t// scale to 0 - 255\n\n\treturn vec4(m3,m2,m1,e);\n}\n\n// select an element from a vector based on index\nfloat select_index_1604150559(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\tvec4 val_v = texture2D(A, vec2(col_t * float(N)/float(N + pad), row_t));\n\tint channel = int(mod(col_t * float(N), 4.0 ));\n\tfloat val = select_index_1604150559(val_v, channel);\n\n\tif (val == 0.) {\n\t\tgl_FragColor = vec4(0.,0.,0.,0.);\n\t\treturn;\n\t}\n\n \t// output vec4 with bytes for an IEEE754 32-bit floating point number\n\tgl_FragColor = encode_float_1540259130(val);\n}\n",
        transpose = "\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform int       M;\t\t// number of rows in output\nuniform int       N;\t\t// number of columns in output\nuniform int       mpad;\t\t//\nuniform int       npad;\t\t//\n\n// select an element from a vector based on index\nfloat select_index_1540259130(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tfloat col = (col_t * float(N + npad) - 2.0); // index of first element in pixel (matrix space)\n\n\t// get rows in the input, each containing one element in the output\n\tvec4 row_1 = texture2D(A, vec2((row_t * float(M))/float(M + mpad), (col + 0.5)/float(N)));\n\tvec4 row_2 = texture2D(A, vec2((row_t * float(M))/float(M + mpad), (col + 1.5)/float(N)));\n\tvec4 row_3 = texture2D(A, vec2((row_t * float(M))/float(M + mpad), (col + 2.5)/float(N)));\n\tvec4 row_4 = texture2D(A, vec2((row_t * float(M))/float(M + mpad), (col + 3.5)/float(N)));\n\n\t// package into output vector\n\tint channel = int(mod(row_t * float(M), 4.0 ));\n\n\tvec4 col_v = vec4(0.0, 0.0, 0.0, 0.0); // vec4 representing four elements in a column in the input\n\n\t// extract relevent element from each input row\n\tcol_v.r = select_index_1540259130(row_1, channel);\n\tif(npad > 0 && (col + 4.0) > float(N) ) {\n\t\t// compute elements in padded region\n\t\tif(npad < 3){\n\t\t\tcol_v.g = select_index_1540259130(row_2, channel);\n\t\t}\n\t\tif(npad < 2){\n\t\t\tcol_v.b = select_index_1540259130(row_3, channel);\n\t\t}\n\t} else {\n\t\tcol_v.g = select_index_1540259130(row_2, channel);\n\t\tcol_v.b = select_index_1540259130(row_3, channel);\n\t\tcol_v.a = select_index_1540259130(row_4, channel);\n\t}\n\n\tgl_FragColor = col_v;\n}\n",
        reshape = "\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform float     M;\t\t// number of rows in output\nuniform float     N;\t\t// number of columns in output\nuniform float     pad;\t\t// column padding in output\nuniform float     M_in;\t\t// number of rows in input\nuniform float     N_in;\t\t// number of columns in input\nuniform float     pad_in;\t// column padding in input\n\n/* number of input pixels\n   origin index (channel) for each\n   termination index (channel) for each\n   destination origin index (channel) for each\n */\n// select an element from a vector based on index\nfloat select_index_1540259130(vec4 v, int index){\n\tfloat val;\n\tif (index == 0) {\n\t\tval = v.r;\n\t} else if(index == 1) {\n\t\tval = v.g;\n\t} else if(index == 2) {\n\t\tval = v.b;\n\t} else if(index == 3){\n\t\tval = v.a;\n\t} else {\n\t\t// should never be here\n\t\tval = 0.0;\n\t}\n\n\treturn val;\n}\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1604150559(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\n// translate a linear index into x, y coordinates for a matrix\nvec2 linear_index_coords_1117569599(float linear_index, float row_length){\n\tvec2 coords;\n\n\tcoords.x = floor(mod(linear_index + 0.5, row_length)); // column\n\tcoords.y = floor((linear_index + 0.5) / row_length); // row\n\n\treturn coords;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\tfloat row = floor(row_t * M);\n\tfloat col_0 = (col_t * (N + pad) - 2.0); // index of first element in pixel (matrix space)\n\t//float col_0 = floor(col_t * (N + pad)/4.0)*4.0; // index of first element in pixel (matrix space)\n\tfloat lin_index_0 = row * N + col_0; // linearized index of first element in pixel in output\n\n\tvec4 pixel_in = vec4(0.0, 0.0, 0.0, 0.0);\n\tvec4 result = vec4(0.0, 0.0, 0.0, 0.0);\n\tvec2 coords = linear_index_coords_1117569599(lin_index_0, N_in);\n\tvec2 ncoords;\n\tint channel_in = int(mod(coords.x, 4.0));\n\n\tvec2 scale_in = vec2(1.0/(N_in + pad_in), 1.0/M_in); // scale from matrix to input texture coords\n\tvec2 offset_in = vec2(0.5, 0.5); // move away from edge of pixel\n\tconst vec2 pixel_scale = vec2(1.0/4.0, 1.0); // scale from matrix to pixel coords\n\n\tpixel_in = texture2D(A, (coords + offset_in) * scale_in);\n\n\t// go through channels for current output pixel\n\tfor(int channel = 0; channel < 4; channel++){\n\n\t\t// are we on a new input pixel?\n\t\tncoords = linear_index_coords_1117569599(lin_index_0 + float(channel), N_in);\n\t\tif(floor(ncoords * pixel_scale) != floor(coords * pixel_scale)){\n\t\t\tcoords = ncoords;\n\t\t\tpixel_in = texture2D(A, (coords + offset_in) * scale_in);\n\t\t\tchannel_in = 0;\n\t\t}\n\n\t\tif(channel == 0){\n\t\t\tresult.r = select_index_1540259130(pixel_in, channel_in);\n\t\t} else if(channel == 1){\n\t\t\tresult.g = select_index_1540259130(pixel_in, channel_in);\n\t\t} else if(channel == 2){\n\t\t\tresult.b = select_index_1540259130(pixel_in, channel_in);\n\t\t} else {\n\t\t\tresult.a = select_index_1540259130(pixel_in, channel_in);\n\t\t}\n\n\t\tchannel_in++;\n\t}\n\n\t// are we in the padded (output) region?\n\tif(pad > 0.0 && col_0 + 3.5 > N ) {\n\t\tfix_pad_1604150559(result, int(pad));\n\t}\n\n\tgl_FragColor = result;\n}\n",
        reshape_simple = "\nprecision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform float     M;\t\t// number of rows in output\nuniform float     N;\t\t// number of columns in output\nuniform float     M_in;\t\t// number of rows in input\nuniform float     N_in;\t\t// number of columns in input\n\n// translate a linear index into x, y coordinates for a matrix\nvec2 linear_index_coords_1540259130(float linear_index, float row_length){\n\tvec2 coords;\n\n\tcoords.x = floor(mod(linear_index + 0.5, row_length)); // column\n\tcoords.y = floor((linear_index + 0.5) / row_length); // row\n\n\treturn coords;\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\n\tfloat row = floor(row_t * M);\n\tfloat col_0 = floor(col_t * N - 1.5); // index of first element in pixel (matrix space)\n\tfloat lin_index_0 = row * N + col_0; // linearized index of first element in pixel in output\n\n\tvec4 result;\n\tvec2 coords = linear_index_coords_1540259130(lin_index_0, N_in);\n\n\tvec2 scale_in = vec2(1.0/N_in, 1.0/M_in); // scale from matrix to input texture coords\n\tvec2 offset_in = vec2(0.5, 0.5); // move away from edge of pixel\n\n\tresult = texture2D(A, (coords + offset_in) * scale_in);\n\n\tgl_FragColor = result;\n}\n",
        submatrix = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D X;\t\t// texture with data from padded X\nuniform float     N;\t\t// number of columns\nuniform float     pad;\t\t// additional columns to nearest multiple of four\nuniform float     N_in;\t\t// number of columns (input)\nuniform float     pad_in;\t// additional columns to nearest multiple of four (input)\nuniform float     stride;\nuniform float     offset;   // zero or one\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1540259130(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\n/* join parts of two pixels into one, selecting four continguous elements\n  starting at channel.\n*/\nvoid join_pixels_1604150559(inout vec4 x, vec4 x0, vec4 x1, float channel){\n\tif(channel == 1.0){\n\t\tx.rgb = x0.gba;\n\t\tx.a = x1.r;\n\t} else if(channel == 2.0){\n\t\tx.rg = x0.ba;\n\t\tx.ba = x1.rg;\n\t} else if(channel == 3.0){\n\t\tx.r = x0.a;\n\t\tx.gba = x1.rgb;\n\t}\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tfloat col = floor(col_t * (N + pad) - 1.5); // index of first element in pixel (output matrix space)\n\n\tfloat stripe = floor(col / stride);\n\tfloat sub_col = floor(mod(col, stride));\n\n\tfloat col_in = (offset + (2.0 * stripe)) * stride + sub_col;\n\n\tvec4 x;\n\tfloat channel = mod(col_in, 4.0); // channel in the input of first element in output\n\n\t// are we at the beggining of an input pixel?\n\tif(channel == 0.0){\n\t\t// yes, select the whole thing\n\t\tx = texture2D( X, vec2((col_in + 2.0 - channel) / (N_in + pad_in) , row_t));\n\t} else {\n\t\t// no, select parts from two pixels\n\t\tvec4 x0, x1;\n\t\tx0 = texture2D( X, vec2((col_in + 2.0 - channel) / (N_in + pad_in) , row_t));\n\t\tx1 = texture2D( X, vec2((col_in + 6.0 - channel) / (N_in + pad_in) , row_t));\n\n\t\tjoin_pixels_1604150559(x, x0, x1, channel);\n\n\t}\n\n\t// fix padded region\n\tif(pad > 0.0 && col + 4.0 > N ) {\n\t\tfix_pad_1540259130(x, int(pad));\n\t}\n\n\tgl_FragColor = x;\n}\n",
        combine = "precision highp float;\n#define GLSLIFY 1\n\nvarying vec2      outTex;\t// texture coords of row/column to calculate\nuniform sampler2D A;\t\t// texture with data from padded A\nuniform sampler2D B;\t\t// texture with data from padded B\nuniform float     N_in;\t\t// number of columns\nuniform float     pad_in;\t// additional columns to nearest multiple of four\nuniform float     stride;\n\n// set pad values to 0.0, if in padded region of output texture\nvoid fix_pad_1540259130(inout vec4 v, int pad){\n\tv.a = 0.0;\n\tif(pad == 2){\n\t\tv.b = 0.0;\n\t} else if(pad == 3){\n\t\tv.b = 0.0;\n\t\tv.g = 0.0;\n\t}\n}\n\nvoid main(void) {\n\n\t// get the implied row and column from .y and .x of passed (output)\n\t// texture coordinate. These map directly to input texture space when\n\t// the relevant dimensions are the same.\n\tfloat row_t = outTex.y;\n\tfloat col_t = outTex.x;\n\tfloat N = N_in * 2.0;\n\tfloat pad = mod(N, 4.0);\n\tfloat col = floor(col_t * (N + pad) - 1.5); // index of first element in pixel (output matrix space)\n\n\tfloat stripe = floor(col / stride);\n\tfloat sub_col = floor(mod(col, stride));\n\n\tfloat tex_select = mod(stripe, 2.0);\n\tfloat col_in = floor(stripe / 2.0) * stride + sub_col;\n\n\tvec4 x;\n\tfloat channel = mod(col_in, 4.0); // channel in the input of first element in output\n\n\t// which input texture are we getting this pixel from?\n\tif(tex_select == 0.0){\n\t\tx = texture2D( A, vec2((col_in + 2.0) / (N_in + pad_in) , row_t));\n\t} else {\n\t\tx = texture2D( B, vec2((col_in + 2.0) / (N_in + pad_in) , row_t));\n\t}\n\n\t// fix padded region\n\tif(pad > 0.0 && col + 4.0 > N ) {\n\t\tfix_pad_1540259130(x, int(pad));\n\t}\n\n\tgl_FragColor = x;\n}\n";

    this.encode_program = this.createProgram(encode);
    this.transpose_program = this.createProgram(transpose);
    this.reshape_program = this.createProgram(reshape);
    this.reshape_simple_program = this.createProgram(reshape_simple);
    this.submatrix_program = this.createProgram(submatrix);
    this.combine_program = this.createProgram(combine);
};

module.exports = WebGL;

// RGBA is the standard input/ouput texture
WebGL.COMPONENTS_PER_TEXEL = 4;

WebGL.POSITION_UNIFORM_NAME = "pos";
WebGL.TEXTURE_UNIFORM_NAME = "tex";


WebGL.prototype.encode = function(M, N, texture0, out){

    this.program = this.encode_program;
    this.selectProgram(this.program);

    var pad = this.getPad(N);

    var N_gl = this.context.getUniformLocation(this.program, "N"),
        pad_gl = this.context.getUniformLocation(this.program, "pad");

    this.context.uniform1i(N_gl, N);
    this.context.uniform1i(pad_gl, pad);

    this.bindInputTexture(texture0, this.context.TEXTURE0, "A");

    this.bindOutputTexture(M, N, out);

    this.context.drawElements(this.context.TRIANGLES, /*num items*/6, this.context.UNSIGNED_SHORT, 0);

    this.unbindInputTexture(this.context.TEXTURE0);
}

/* tranpose a texture where input has M rows and N columns
    */
WebGL.prototype.transpose = function(M, N, texture0, out){

    this.program = this.transpose_program;
    this.selectProgram(this.program);

    var npad = this.getPad(N),
        mpad = this.getPad(M);

    // in the shader M and N describe rows and columns in the *output*, respectively
    var N_gl = this.context.getUniformLocation(this.program, "N"),
        npad_gl = this.context.getUniformLocation(this.program, "npad"),
        M_gl = this.context.getUniformLocation(this.program, "M"),
        mpad_gl = this.context.getUniformLocation(this.program, "mpad");

    this.context.uniform1i(N_gl, M);
    this.context.uniform1i(npad_gl, mpad);
    this.context.uniform1i(M_gl, N);
    this.context.uniform1i(mpad_gl, npad);

    this.bindInputTexture(texture0, this.context.TEXTURE0, "A");

    this.bindOutputTexture(N, (M + mpad)/4, out);

    this.context.drawElements(this.context.TRIANGLES, /*num items*/6, this.context.UNSIGNED_SHORT, 0);

    this.unbindInputTexture(this.context.TEXTURE0);
};

/* tranpose a texture where input has M rows and N columns
    */
WebGL.prototype.reshape = function(M, N, M_out, N_out, texture0, out){

    var pad = this.getPad(N),
        pad_out = this.getPad(N_out);

    if(pad == 0 && pad_out == 0){
        this.program = this.reshape_simple_program;
    } else {
        this.program = this.reshape_program;
        console.log("# WARNING: using slow reshape shader.");
    }

    this.selectProgram(this.program);


    // in the shader M and N describe rows and columns in the *output*, respectively
    var M_gl = this.context.getUniformLocation(this.program, "M"),
        N_gl = this.context.getUniformLocation(this.program, "N"),
        pad_gl = this.context.getUniformLocation(this.program, "pad"),
        M_in_gl = this.context.getUniformLocation(this.program, "M_in"),
        N_in_gl = this.context.getUniformLocation(this.program, "N_in"),
        pad_in_gl = this.context.getUniformLocation(this.program, "pad_in");

    this.context.uniform1f(M_gl, M_out);
    this.context.uniform1f(N_gl, N_out);
    this.context.uniform1f(pad_gl, pad_out);
    this.context.uniform1f(M_in_gl, M);
    this.context.uniform1f(N_in_gl, N);
    this.context.uniform1f(pad_in_gl, pad);

    this.bindInputTexture(texture0, this.context.TEXTURE0, "A");

    this.bindOutputTexture(M_out, (N_out + pad_out)/4, out);

    this.context.drawElements(this.context.TRIANGLES, /*num items*/6, this.context.UNSIGNED_SHORT, 0);

    this.unbindInputTexture(this.context.TEXTURE0);
};

/* extract a portion of a texture into another texture
    */
WebGL.prototype.submatrix = function(N, M_out, N_out, stride, offset, texture0, out){

    this.program = this.submatrix_program;
    this.selectProgram(this.program);

    var pad = this.getPad(N),
        pad_out = this.getPad(N_out);

    // in the shader M and N describe rows and columns in the *output*, respectively
    var N_gl = this.context.getUniformLocation(this.program, "N"),
        pad_gl = this.context.getUniformLocation(this.program, "pad"),
        N_in_gl = this.context.getUniformLocation(this.program, "N_in"),
        pad_in_gl = this.context.getUniformLocation(this.program, "pad_in"),
        offset_gl = this.context.getUniformLocation(this.program, "offset");
        stride_gl = this.context.getUniformLocation(this.program, "stride");

    this.context.uniform1f(N_gl, N_out);
    this.context.uniform1f(pad_gl, pad_out);
    this.context.uniform1f(N_in_gl, N);
    this.context.uniform1f(pad_in_gl, pad);
    this.context.uniform1f(stride_gl, stride);
    this.context.uniform1f(offset_gl, offset);

    this.bindInputTexture(texture0, this.context.TEXTURE0, "X");

    this.bindOutputTexture(M_out, (N_out + pad_out)/4, out);

    this.context.drawElements(this.context.TRIANGLES, /*num items*/6, this.context.UNSIGNED_SHORT, 0);

    this.unbindInputTexture(this.context.TEXTURE0);
};

/* combine two smaller textures into a larger texture
    M - input rows
    N - input columns
    */
WebGL.prototype.combine = function(M, N, stride, texture0, texture1, out){

    this.program = this.combine_program;
    this.selectProgram(this.program);

    var N_out = N * 2,
        pad = this.getPad(N),
        pad_out = this.getPad(N_out); // = (pad * 2) % 4

    // in the shader M and N describe rows and columns in the *output*, respectively
    var N_in_gl = this.context.getUniformLocation(this.program, "N_in"),
        pad_in_gl = this.context.getUniformLocation(this.program, "pad_in"),
        stride_gl = this.context.getUniformLocation(this.program, "stride");

    this.context.uniform1f(N_in_gl, N);
    this.context.uniform1f(pad_in_gl, pad);
    this.context.uniform1f(stride_gl, stride);

    this.bindInputTexture(texture0, this.context.TEXTURE0, "A");
    this.bindInputTexture(texture1, this.context.TEXTURE1, "B");

    this.bindOutputTexture(M, (N_out + pad_out)/4, out);

    this.context.drawElements(this.context.TRIANGLES, /*num items*/6, this.context.UNSIGNED_SHORT, 0);

    this.unbindInputTexture(this.context.TEXTURE0);
};

WebGL.prototype.bindInputTexture = function(texture, textureUnit, name){
    var gl = this.context,
        program = this.program;

    gl.activeTexture(textureUnit); // gl.TEXTURE0, gl.TEXTURE1, etc
    gl.bindTexture(	  gl.TEXTURE_2D, texture);

    var sampler = gl.getUniformLocation(program, name);
    gl.uniform1i(sampler, textureUnit - gl.TEXTURE0);

};

/*  Create a shader program based on a pass through vertex shader and
    the supplied operation specific fragment shader.

    fragmentShaderSource - string containing the fragment shader source code.
    shader will recieve `vec2 outTex` with texture coordinates from the pass
    through vertex shader.
    */
WebGL.prototype.createProgram = function(fragmentShaderSource){
    var gl = this.context,
        fragmentShader;

    if (gl == null) {
        // No webgl support.
        return;
    }
    // compile the provided fragment/texture shader
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // did it compile correctly?
    if (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) == 0)
        throw new Error(gl.getShaderInfoLog(fragmentShader));

    // link the program specific fragment shader and the generic pass through
    // shader into a program
    var program = gl.createProgram();
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
};

WebGL.prototype.selectProgram = function(program){

    var gl = this.context;

    // set calculator program to current shader program
    gl.useProgram(program);

    this.bindVertices(program);
};

/* setup required to draw a square to our vertex shader and have
    fragment shader called for each pixel
    */
WebGL.prototype.bindVertices = function(program) {
    var gl = this.context,
        renderer = program;

    // bind vertices
    var position = gl.getAttribLocation(renderer, WebGL.POSITION_UNIFORM_NAME);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // define a square that covers the screen
    var vertices = [-1.0, -1.0, 0.0,	// bottom left
                        1.0, -1.0, 0.0,	// bottom right
                        1.0,  1.0, 0.0,	// top right
                    -1.0,  1.0, 0.0];	// top left
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, /*item size*/3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    // bind texture cords
    var texture = gl.getAttribLocation(renderer, WebGL.TEXTURE_UNIFORM_NAME);
    var texCoords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
    var textureCoords = [0.0, 0.0,
                            1.0, 0.0,
                            1.0, 1.0,
                            0.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texture, /*item size*/2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texture);

    // index to vertices
    var indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    // tesselate square into triangles
    // indeces into vertex array creating triangles, with counter-clockwise winding
    var vertexIndices = [0, 1, 2,	// bottom right triangle
                            0, 2, 3];	// top left triangle
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
};

/* create RGBA texture of width w/4 from given texels
    padding the width of each row to a multiple of 4, where necessary.

    if texels is null, an empty texture is created.

    alternative to textures?
    http://stackoverflow.com/questions/17203508/webgl-hardware-skinning-with-a-bone-texture
    */
WebGL.prototype.createDataTexture = function(h, w, texels){

    var gl = this.context;

    var PAD_TEMPLATE = [0.0, 0.0, 0.0, 0.0]; // value to pad remainder with

    var rem = (w % WebGL.COMPONENTS_PER_TEXEL),
        pad = rem == 0 ? 0 : WebGL.COMPONENTS_PER_TEXEL - rem;

    // create the texture from our floats
    var texture = gl.createTexture();

    gl.bindTexture(	  gl.TEXTURE_2D, texture);
    /*
    // https://www.opengl.org/wiki/GLAPI/glPixelStore
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, w/4);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    see also: https://www.opengl.org/wiki/Common_Mistakes#Creating_a_complete_texture
    */
    if(pad == 0 || texels == null || typeof texels === 'undefined'){
        // no padding required, write directly from input array
        gl.texImage2D(	  gl.TEXTURE_2D, 0, gl.RGBA, (w + pad) / WebGL.COMPONENTS_PER_TEXEL, h, 0,
                            gl.RGBA, gl.FLOAT, texels);

    } else {
        // must pad each row

        // create empty texture
        gl.texImage2D(	  gl.TEXTURE_2D, 0, gl.RGBA, (w + pad) / WebGL.COMPONENTS_PER_TEXEL, h, 0,
                            gl.RGBA, gl.FLOAT, null);

        var full_texel_row_len = w - rem,
            full_row_texture_width = full_texel_row_len / WebGL.COMPONENTS_PER_TEXEL;

        var row_start = 0;
        var last_texel = new Float32Array(PAD_TEMPLATE);
        var row, remainder;

        // set texture data, one row at a time, padding each row to a multiple
        // of the texel length
        for(var i = 0; i < h; i++){
            row_start = i * w;
            full_texel_row_end = row_start + full_texel_row_len;
            row = new Float32Array(texels.buffer, row_start * texels.BYTES_PER_ELEMENT, full_texel_row_len);
            if(full_texel_row_len > 0){
                // https://www.khronos.org/registry/webgl/specs/latest/1.0/index.html#TEXSUBIMAGE2D
                gl.texSubImage2D(gl.TEXTURE_2D,
                        0,					// mip-map level
                        0,					// x-offset
                        i,					// y-offset
                        full_row_texture_width,	// width
                        1,					// height
                        gl.RGBA,			// format
                        gl.FLOAT,			// type
                        row			// data
                    );
            }

            remainder = new Float32Array(texels.buffer, full_texel_row_end * texels.BYTES_PER_ELEMENT, rem);
            last_texel.set(remainder); // copy remaining data

            gl.texSubImage2D(gl.TEXTURE_2D,
                    0,				// mip-map level
                    full_row_texture_width, // x-offset
                    i,				// y-offset
                    1,				// width
                    1,				// height
                    gl.RGBA,		// format
                    gl.FLOAT,		// type
                    last_texel		// data
                );
        }
    }

    // clamp to edge to support non-power of two textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // don't interpolate when getting data from texture
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // we're done with setup, so unbind current texture
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
};

/* Create a (padded) texture suitable for reading into an array with readPixels.
    UNSIGNED_BYTE
    Can be passed to bindDestinationTexture.

    Returns an unsigned byte RGBA texture (other formats are not yet supported
    on most platforms, see WEBGL_color_buffer_float extension)
    */
WebGL.prototype.createOutputTexture = function(h, w) {
    var gl = this.context;

    var pad = this.getPad(w);

    // create and bind texture to render to
    var destTexture = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, destTexture);
    gl.texImage2D(gl.TEXTURE_2D,/*level*/0, gl.RGBA, w + pad, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // clamp to edge to support non-power of two textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // don't interpolate when getting data from texture
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // we're done with setup, so unbind current texture
    gl.bindTexture(gl.TEXTURE_2D, null);

    return destTexture;
};

/* Set up output

    M - number of rows in output
    N - number of columns in output
    dstTex - texture for holding the output
    */
WebGL.prototype.bindOutputTexture = function(M, N, texture) {
    var gl = this.context;

    // set canvas and viewport size
    this.canvas.height = M;
    this.canvas.width = N;
    gl.viewport(0, 0, N, M);

    // create and bind framebuffer
    this.framebuffer = this.framebuffer || gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, /*level*/0);


    if( gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        throw new Error("Bound framebuffer is not complete.");

    return this.framebuffer;
};

WebGL.prototype.unbindInputTexture = function(textureUnit){
    var gl = this.context;

    gl.activeTexture(textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

/* Read data out as unsigned bytes */
WebGL.prototype.readData = function(M, N){
    var gl = this.context;

    // create destination buffer
    rawbuffer = new ArrayBuffer(M*N*Float32Array.BYTES_PER_ELEMENT);

    // read the result into our buffer, as bytes
    prod = new Uint8Array(rawbuffer);
    gl.readPixels(0, 0, N, M, gl.RGBA, gl.UNSIGNED_BYTE, prod);

    // return raw result bytes
    return rawbuffer; // M x N
};

// how many extra elements do we need to fill up a pixel?
WebGL.prototype.getPad = function(N){

    var rem = (N % WebGL.COMPONENTS_PER_TEXEL),
        pad = rem == 0 ? 0 : WebGL.COMPONENTS_PER_TEXEL - rem;

    return pad;
};

},{}],13:[function(require,module,exports){
exports.load = function(url, type, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) {
            return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
            var arrayBuffer = xhr.response;
            if (arrayBuffer) {
                try{

                    // parse according to type
                    var data = new type(arrayBuffer);

                    // return result
                    return callback(null, data);
                } catch (e){
                    return callback(e);
                }
            } else {
                return callback("empty response");
            }

        } else {
            var err = new Error("failed to request file '" + url + "'");
            // follow Node.js error signature
            err.errno = 34;
            callback(err);
        }
    };

    try {
        xhr.open('GET', url, true);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
    } catch (err) {
        callback(err);
    }
};

},{}],14:[function(require,module,exports){
(function (process,global){
/**
 * @license
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":15}],15:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});