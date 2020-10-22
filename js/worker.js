importScripts("/js/numeric.js");

// vector.js
(function(a){(function(b){function c(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=0,q=0;q<l.length;++q)n+=l[q]*m[q];return n}function d(l){for(var m=0,n=0;n<l.length;++n)m+=l[n]*l[n];return m}function e(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=0,q=0;q<l.length;++q){var p=l[q]-m[q];n+=p*p}return n}function g(l,m){var n=l[0]-m[0],q=l[1]-m[1];l=l[2]-m[2];return n*n+q*q+l*l}function h(l){for(var m=d3.randomNormal(),
n=new Float32Array(l),q=0;q<l;++q)n[q]=m();return n}function k(l,m){return c(l,m)/Math.sqrt(d(l)*d(m))}b.dot=c;b.sum=function(l){for(var m=0,n=0;n<l.length;++n)m+=l[n];return m};b.add=function(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=new Float32Array(l.length),q=0;q<l.length;++q)n[q]=l[q]+m[q];return n};b.sub=function(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=new Float32Array(l.length),q=0;q<l.length;++q)n[q]=
l[q]-m[q];return n};b.norm2=d;b.dist=function(l,m){return Math.sqrt(e(l,m))};b.dist2=e;b.dist2_2D=function(l,m){var n=l[0]-m[0];l=l[1]-m[1];return n*n+l*l};b.dist2_3D=g;b.dist_3D=function(l,m){return Math.sqrt(g(l,m))};b.dist2WithLimit=function(l,m,n){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var q=0,p=0;p<l.length;++p){var t=l[p]-m[p];q+=t*t;if(q>=n)return-1}return q};b.dist22D=function(l,m){var n=l[0]-m[0];l=l[1]-m[1];return n*n+l*l};b.unit=function(l){var m=
Math.sqrt(d(l));a.util.assert(0<=m,"Norm of the vector must be \x3e 0");for(var n=0;n<l.length;++n)l[n]/=m};b.projectRandom=function(l,m){for(var n=l[0].length,q=l.length,p=Array(q),t=0;t<q;++t)p[t]=new Float32Array(m);for(var r=0;r<m;++r){var v=h(n);for(t=0;t<q;++t)p[t][r]=c(l[t],v)}return p};b.project2d=function(l,m,n){return[c(l,m),c(l,n)]};b.centroid=function(l,m){if(0===l.length)return null;null==m&&(m=function(r){return r});a.util.assert(0<=l.length,"`vectors` must be of length \x3e\x3d 1");
for(var n=new Float32Array(m(l[0]).length),q=0;q<l.length;++q)for(var p=m(l[q]),t=0;t<n.length;++t)n[t]+=p[t];for(t=0;t<n.length;++t)n[t]/=l.length;return n};b.rn=h;b.cosDistNorm=function(l,m){return 1-c(l,m)};b.cosDist=function(l,m){return 1-k(l,m)};b.cosSim=k;b.toTypedArray=function(l,m){for(var n=l.length,q=m(l[0]).length,p=new Float32Array(n*q),t=0;t<n;++t)for(var r=m(l[t]),v=0;v<q;++v)p[t*q+v]=r[v];return p};b.transposeTypedArray=function(l,m,n){for(var q=new Float32Array(l*m),p=0;p<l;++p)for(var t=
0;t<m;++t)q[t*l+p]=n[p*m+t];return q}})(a.vector||(a.vector={}))})(self);

/*
in:
points
shuffledDataIndices

out:
fracVariancesExplained
points
projections
*/

var PCA_SAMPLE_SIZE = 50000;
var PCA_SAMPLE_DIM = 200;
var NUM_PCA_COMPONENTS = 10;
addEventListener("message", function (ev) {
    var data = ev.data;
    var dim = data.points[0].vector.length;
    var vectors = data.shuffledDataIndices.map(function (i) {
        return data.points[i].vector;
    });

    if (dim > PCA_SAMPLE_DIM) {
        vectors = vector.projectRandom(vectors, PCA_SAMPLE_DIM);
    }

    var sampledVectors = vectors.slice(0, PCA_SAMPLE_SIZE);
    var dot = numeric.dot;
    var transpose = numeric.transpose;
    var numericSvd = numeric.svd;

    var div = numeric['div'];
    var scalar = dot(transpose(sampledVectors), sampledVectors);
    var sigma = div(scalar, sampledVectors.length);
    var svd = numericSvd(sigma);
    var variances = svd.S;
    var totalVariance = 0;

    for (var _i = 0; _i < variances.length; ++_i) {
        totalVariance += variances[_i];
    }

    for (var _i2 = 0; _i2 < variances.length; ++_i2) {
        variances[_i2] /= totalVariance;
    }

    var ret = {
        projections: {},
        points: []
    };

    for (var i = 0; i < data.points.length; ++i) {
        ret.points.push({
            projections: {}
        });
    }

    ret.fracVariancesExplained = variances;
    var U = svd.U;
    var pcaVectors = vectors.map(function (vector) {
        var newV = new Float32Array(NUM_PCA_COMPONENTS);

        for (var newDim = 0; newDim < NUM_PCA_COMPONENTS; newDim++) {
            var _dot = 0;

            for (var oldDim = 0; oldDim < vector.length; oldDim++) {
                _dot += vector[oldDim] * U[oldDim][newDim];
            }

            newV[newDim] = _dot;
        }

        return newV;
    });

    for (var d = 0; d < NUM_PCA_COMPONENTS; d++) {
        var label = 'pca-' + d;
        ret.projections[label] = true;

        for (var _i3 = 0; _i3 < pcaVectors.length; _i3++) {
            var pointIndex = data.shuffledDataIndices[_i3];
            ret.points[pointIndex].projections[label] = pcaVectors[_i3][d];
        }
    }

    this.postMessage(ret)
}, false);