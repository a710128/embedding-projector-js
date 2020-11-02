importScripts("/js/numeric.js");
importScripts("/js/d3.js");

// util.js
(function(a){(function(b){b.shuffle=function(d){for(var e=d.length,g,h;e;)h=Math.floor(Math.random()*e--),g=d[e],d[e]=d[h],d[h]=g;return d};b.range=function(d){for(var e=[],g=0;g<d;g++)e.push(g);return e};b.classed=function(d,e,g){var h=d.className.split(" ");if(g){if(e in h)return;h.push(e)}else{e=h.indexOf(e);if(-1===e)return;h.splice(e,1)}d.className=h.join(" ")};b.vector3DToScreenCoords=function(d,e,g,h){var k=window.devicePixelRatio;d=(new f.Vector3).copy(h).project(d);return[(d.x+1)/2*e*k,-((d.y-
1)/2*g)*k]};b.vector3FromPackedArray=function(d,e){e*=3;return new f.Vector3(d[e],d[e+1],d[e+2])};b.getNearFarPoints=function(d,e,g){var h=Infinity,k=0;g=(new f.Vector3).copy(g).sub(e);g=(new f.Vector3).copy(g).normalize();for(var l=d.length/3,m=0,n=new f.Vector3,q=new f.Vector3,p=0;p<l;p++){n.x=d[m];n.y=d[m+1];n.z=d[m+2];m+=3;q.copy(n).sub(e);var t=g.dot(q);0>t||(k=t>k?t:k,h=t<h?t:h)}return[h,k]};b.createTexture=function(d){d=new f.Texture(d);d.needsUpdate=!0;d.minFilter=f.LinearFilter;d.generateMipmaps=
!1;d.flipY=!1;return d};b.assert=function(d,e){if(!d)throw Error(e||"Assertion failed");};b.getSearchPredicate=function(d,e,g){if(e){var h=new RegExp(d,"i");e=function(k){return h.test(k.metadata[g].toString())}}else d=d.toLowerCase(),e=function(k){return 0<=k.metadata[g].toString().toLowerCase().indexOf(d)};return e};b.runAsyncTask=function(d,e,g,h){void 0===g&&(g=null);void 0===h&&(h=200);var k=null==g;return new Promise(function(l,m){setTimeout(function(){try{var n=
e();l(n)}catch(q){m(q)}return!0},h)})};b.getURLParams=function(){var d=window.location.search;if(!d)return{};d=-1!==d.indexOf("?")?d.split("?")[1]:d;d.indexOf("#")&&(d=d.split("#")[0]);d=d.split("\x26");for(var e={},g=0;g<d.length;g++){var h=d[g].split("\x3d");e[h[0].toLowerCase()]=decodeURIComponent(h[1])}return e};var c=["/Adagrad"];b.tensorIsGenerated=function(d){for(var e=0;e<c.length;e++)if(0<=d.indexOf(c[e]))return!0;return!1};b.xor=function(d,e){return(d||
e)&&!(d&&e)};b.hasWebGLSupport=function(){try{var d=document.createElement("canvas");return null!=(d.getContext("webgl")||d.getContext("experimental-webgl"))&&"undefined"!==typeof weblas}catch(e){return!1}}})(a.util||(a.util={}))})(self);

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
