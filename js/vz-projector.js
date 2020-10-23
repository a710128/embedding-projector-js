(function(){
var wc = {};
// vector.js
(function(a){(function(b){function c(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=0,q=0;q<l.length;++q)n+=l[q]*m[q];return n}function d(l){for(var m=0,n=0;n<l.length;++n)m+=l[n]*l[n];return m}function e(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=0,q=0;q<l.length;++q){var p=l[q]-m[q];n+=p*p}return n}function g(l,m){var n=l[0]-m[0],q=l[1]-m[1];l=l[2]-m[2];return n*n+q*q+l*l}function h(l){for(var m=d3.randomNormal(),
n=new Float32Array(l),q=0;q<l;++q)n[q]=m();return n}function k(l,m){return c(l,m)/Math.sqrt(d(l)*d(m))}b.dot=c;b.sum=function(l){for(var m=0,n=0;n<l.length;++n)m+=l[n];return m};b.add=function(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=new Float32Array(l.length),q=0;q<l.length;++q)n[q]=l[q]+m[q];return n};b.sub=function(l,m){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var n=new Float32Array(l.length),q=0;q<l.length;++q)n[q]=
l[q]-m[q];return n};b.norm2=d;b.dist=function(l,m){return Math.sqrt(e(l,m))};b.dist2=e;b.dist2_2D=function(l,m){var n=l[0]-m[0];l=l[1]-m[1];return n*n+l*l};b.dist2_3D=g;b.dist_3D=function(l,m){return Math.sqrt(g(l,m))};b.dist2WithLimit=function(l,m,n){a.util.assert(l.length===m.length,"Vectors a and b must be of same length");for(var q=0,p=0;p<l.length;++p){var t=l[p]-m[p];q+=t*t;if(q>=n)return-1}return q};b.dist22D=function(l,m){var n=l[0]-m[0];l=l[1]-m[1];return n*n+l*l};b.unit=function(l){var m=
Math.sqrt(d(l));a.util.assert(0<=m,"Norm of the vector must be \x3e 0");for(var n=0;n<l.length;++n)l[n]/=m};b.projectRandom=function(l,m){for(var n=l[0].length,q=l.length,p=Array(q),t=0;t<q;++t)p[t]=new Float32Array(m);for(var r=0;r<m;++r){var v=h(n);for(t=0;t<q;++t)p[t][r]=c(l[t],v)}return p};b.project2d=function(l,m,n){return[c(l,m),c(l,n)]};b.centroid=function(l,m){if(0===l.length)return null;null==m&&(m=function(r){return r});a.util.assert(0<=l.length,"`vectors` must be of length \x3e\x3d 1");
for(var n=new Float32Array(m(l[0]).length),q=0;q<l.length;++q)for(var p=m(l[q]),t=0;t<n.length;++t)n[t]+=p[t];for(t=0;t<n.length;++t)n[t]/=l.length;return n};b.rn=h;b.cosDistNorm=function(l,m){return 1-c(l,m)};b.cosDist=function(l,m){return 1-k(l,m)};b.cosSim=k;b.toTypedArray=function(l,m){for(var n=l.length,q=m(l[0]).length,p=new Float32Array(n*q),t=0;t<n;++t)for(var r=m(l[t]),v=0;v<q;++v)p[t*q+v]=r[v];return p};b.transposeTypedArray=function(l,m,n){for(var q=new Float32Array(l*m),p=0;p<l;++p)for(var t=
0;t<m;++t)q[t*l+p]=n[p*m+t];return q}})(a.vector||(a.vector={}))})(wc);

// heap.js
(function(a){var b=function(){function d(){this.arr=[]}d.prototype.push=function(e,g){this.arr.push({key:e,value:g});this.bubbleUp(this.arr.length-1)};d.prototype.pop=function(){if(0===this.arr.length)throw Error("pop() called on empty binary heap");var e=this.arr[0],g=this.arr.length-1;this.arr[0]=this.arr[g];this.arr.pop();0<g&&this.bubbleDown(0);return e};d.prototype.peek=function(){return this.arr[0]};d.prototype.popPush=function(e,g){if(0===this.arr.length)throw Error("pop() called on empty binary heap");this.arr[0]=
{key:e,value:g};0<this.arr.length&&this.bubbleDown(0)};d.prototype.size=function(){return this.arr.length};d.prototype.items=function(){return this.arr};d.prototype.swap=function(e,g){var h=this.arr[e];this.arr[e]=this.arr[g];this.arr[g]=h};d.prototype.bubbleDown=function(e){var g=(e<<1)+1,h=g+1,k=e;g<this.arr.length&&this.arr[g].key<this.arr[k].key&&(k=g);h<this.arr.length&&this.arr[h].key<this.arr[k].key&&(k=h);k!==e&&(this.swap(k,e),this.bubbleDown(k))};d.prototype.bubbleUp=function(e){if(!(0>=
e)){var g=e-1>>1;this.arr[e].key<this.arr[g].key&&(this.swap(e,g),this.bubbleUp(g))}};return d}();a.MinHeap=b;var c=function(){function d(e){this.maxHeap=new b;this.k=e}d.prototype.add=function(e,g){this.maxHeap.size()<this.k?this.maxHeap.push(-e,g):e<-this.maxHeap.peek().key&&this.maxHeap.popPush(-e,g)};d.prototype.getMinKItems=function(){var e=this.maxHeap.items();e.sort(function(g,h){return h.key-g.key});return e.map(function(g){return g.value})};d.prototype.getSize=function(){return this.maxHeap.size()};
d.prototype.getLargestKey=function(){return 0===this.maxHeap.size()?null:-this.maxHeap.peek().key};return d}();a.KMin=c})(wc);

// util.js
(function(a){(function(b){b.shuffle=function(d){for(var e=d.length,g,h;e;)h=Math.floor(Math.random()*e--),g=d[e],d[e]=d[h],d[h]=g;return d};b.range=function(d){for(var e=[],g=0;g<d;g++)e.push(g);return e};b.classed=function(d,e,g){var h=d.className.split(" ");if(g){if(e in h)return;h.push(e)}else{e=h.indexOf(e);if(-1===e)return;h.splice(e,1)}d.className=h.join(" ")};b.vector3DToScreenCoords=function(d,e,g,h){var k=window.devicePixelRatio;d=(new f.Vector3).copy(h).project(d);return[(d.x+1)/2*e*k,-((d.y-
1)/2*g)*k]};b.vector3FromPackedArray=function(d,e){e*=3;return new f.Vector3(d[e],d[e+1],d[e+2])};b.getNearFarPoints=function(d,e,g){var h=Infinity,k=0;g=(new f.Vector3).copy(g).sub(e);g=(new f.Vector3).copy(g).normalize();for(var l=d.length/3,m=0,n=new f.Vector3,q=new f.Vector3,p=0;p<l;p++){n.x=d[m];n.y=d[m+1];n.z=d[m+2];m+=3;q.copy(n).sub(e);var t=g.dot(q);0>t||(k=t>k?t:k,h=t<h?t:h)}return[h,k]};b.createTexture=function(d){d=new f.Texture(d);d.needsUpdate=!0;d.minFilter=f.LinearFilter;d.generateMipmaps=
!1;d.flipY=!1;return d};b.assert=function(d,e){if(!d)throw Error(e||"Assertion failed");};b.getSearchPredicate=function(d,e,g){if(e){var h=new RegExp(d,"i");e=function(k){return h.test(k.metadata[g].toString())}}else d=d.toLowerCase(),e=function(k){return 0<=k.metadata[g].toString().toLowerCase().indexOf(d)};return e};b.runAsyncTask=function(d,e,g,h){void 0===g&&(g=null);void 0===h&&(h=200);var k=null==g;return new Promise(function(l,m){setTimeout(function(){try{var n=
e();l(n)}catch(q){m(q)}return!0},h)})};b.getURLParams=function(){var d=window.location.search;if(!d)return{};d=-1!==d.indexOf("?")?d.split("?")[1]:d;d.indexOf("#")&&(d=d.split("#")[0]);d=d.split("\x26");for(var e={},g=0;g<d.length;g++){var h=d[g].split("\x3d");e[h[0].toLowerCase()]=decodeURIComponent(h[1])}return e};var c=["/Adagrad"];b.tensorIsGenerated=function(d){for(var e=0;e<c.length;e++)if(0<=d.indexOf(c[e]))return!0;return!1};b.xor=function(d,e){return(d||
e)&&!(d&&e)};b.hasWebGLSupport=function(){try{var d=document.createElement("canvas");return null!=(d.getContext("webgl")||d.getContext("experimental-webgl"))&&"undefined"!==typeof weblas}catch(e){return!1}}})(a.util||(a.util={}))})(wc);

// knn.js
(function(a){(function(b){function c(d,e,g,h){return a.util.runAsyncTask("Finding nearest neighbors...",function(){for(var k=d.length,l=Array(k),m=Array(k),n=0;n<k;n++)m[n]=new a.KMin(e);for(n=0;n<k;n++)for(var q=g(d[n]),p=m[n],t=n+1;t<k;t++){var r=m[t],v=p.getSize()===e?p.getLargestKey()||Number.MAX_VALUE:Number.MAX_VALUE,u=r.getSize()===e?r.getLargestKey()||Number.MAX_VALUE:Number.MAX_VALUE;v=Math.max(v,u);v=h(q,g(d[t]),v);0<=v&&(p.add(v,{index:t,dist:v}),r.add(v,{index:n,dist:v}))}for(n=0;n<k;n++)l[n]=
m[n].getMinKItems();return l})}b.findKNNGPUCosine=function(d,e,g){function h(A){a.util.runAsyncTask("Finding nearest neighbors: "+(100*u).toFixed()+"%",function(){for(var y=x<r?t+1:t,B=new Float32Array(y*l),F=0;F<y;++F)for(var K=g(d[v+F]),L=0;L<l;++L)B[F*l+L]=K[L];F=new weblas.pipeline.Tensor([y,l],B);K=weblas.pipeline.sgemm(1,n,F,null,null);B=K.transfer();F.delete();K.delete();u+=w;for(F=0;F<y;F++){K=new a.KMin(e);L=v+F;for(var N=0;N<k;N++)if(N!==L){var Q=1-B[N*y+F];K.add(Q,{index:N,dist:Q})}q[L]=
K.getMinKItems()}u+=w;v+=y;x++},"knn-gpu").then(function(){x<p?h(A):(a.logging.setModalMessage(null,"knn-gpu"),n.delete(),A(q))},function(){a.logging.setModalMessage(null,"knn-gpu");c(d,e,g,function(y,B){return a.vector.cosDistNorm(y,B)}).then(function(y){A(y)})})}var k=d.length,l=g(d[0]).length,m=a.vector.toTypedArray(d,g),n=new weblas.pipeline.Tensor([k,l],m),q=Array(k),p=Math.ceil(k/256),t=Math.floor(k/p),r=k%p,v=0,u=0,w=1/(2*p),x=0;return new Promise(function(A){return h(A)})};b.findKNN=c;b.findKNNofPoint=
function(d,e,g,h,k){g=new a.KMin(g);for(var l=h(d[e]),m=0;m<d.length;++m)if(m!==e){var n=h(d[m]);n=k(l,n);g.add(n,{index:m,dist:n})}return g.getMinKItems()}})(a.knn||(a.knn={}))})(wc);

// data.js
var xc=this&&this.__awaiter||function(a,b,c,d){return new (c||(c=Promise))(function(e,g){function h(m){try{l(d.next(m))}catch(n){g(n)}}function k(m){try{l(d["throw"](m))}catch(n){g(n)}}function l(m){m.done?e(m.value):(new c(function(n){n(m.value)})).then(h,k)}l((d=d.apply(a,b||[])).next())})},yc=this&&this.__generator||function(a,b){function c(m){return function(n){return d([m,n])}}function d(m){if(g)throw new TypeError("Generator is already executing.");for(;e;)try{if(g=1,h&&(k=m[0]&2?h["return"]:
m[0]?h["throw"]||((k=h["return"])&&k.call(h),0):h.next)&&!(k=k.call(h,m[1])).done)return k;if(h=0,k)m=[m[0]&2,k.value];switch(m[0]){case 0:case 1:k=m;break;case 4:return e.label++,{value:m[1],done:!1};case 5:e.label++;h=m[1];m=[0];continue;case 7:m=e.ops.pop();e.trys.pop();continue;default:if(!(k=e.trys,k=0<k.length&&k[k.length-1])&&(6===m[0]||2===m[0])){e=0;continue}if(3===m[0]&&(!k||m[1]>k[0]&&m[1]<k[3]))e.label=m[1];else if(6===m[0]&&e.label<k[1])e.label=k[1],k=m;else if(k&&e.label<k[2])e.label=
k[2],e.ops.push(m);else{k[2]&&e.ops.pop();e.trys.pop();continue}}m=b.call(a,e)}catch(n){m=[6,n],h=0}finally{g=k=0}if(m[0]&5)throw m[1];return{value:m[0]?m[1]:void 0,done:!0}}var e={label:0,sent:function(){if(k[0]&1)throw k[1];return k[1]},trys:[],ops:[]},g,h,k,l;return l={next:c(0),"throw":c(1),"return":c(2)},"function"===typeof Symbol&&(l[Symbol.iterator]=function(){return this}),l};
(function(a){function b(g){for(var h=null,k=0,l=e;k<l.length;k++){var m=l[k];if(m in g&&""!==g[m]){h=g[m];break}}return null==h?null:+h}var c=0<=navigator.userAgent.toLowerCase().indexOf("firefox"),d=a.util.hasWebGLSupport()&&!c;a.TSNE_SAMPLE_SIZE=1E4;a.UMAP_SAMPLE_SIZE=5E3;a.PCA_SAMPLE_SIZE=5E4;a.PCA_SAMPLE_DIM=200;var e=["__next__","__seq_next__"];c=function(){function g(h,k){this.shuffledDataIndices=[];this.projections={};this.tSNEIteration=0;this.tSNEShouldPause=!1;this.tSNEShouldStop=!0;this.superviseInput=
"";this.dim=[0,0];this.hasUmapRun=this.hasTSNERun=!1;this.points=h;this.shuffledDataIndices=a.util.shuffle(a.util.range(this.points.length));this.sequences=this.computeSequences(h);this.dim=[this.points.length,this.points[0].vector.length];this.spriteAndMetadataInfo=k}g.prototype.computeSequences=function(h){for(var k=new Int8Array(h.length),l={},m=[],n=0;n<h.length;n++)if(!k[n]){k[n]=1;var q=b(h[n].metadata);if(null!=q)if(q in l)q=l[q],q.pointIndices.unshift(n),l[n]=q;else{q={pointIndices:[]};l[n]=
q;m.push(q);for(var p=n;h[p];)q.pointIndices.push(p),p=b(h[p].metadata),null!=p?k[p]=1:p=-1}}return m};g.prototype.projectionCanBeRendered=function(h){return"tsne"!==h?!0:0<this.tSNEIteration};g.prototype.getSubset=function(h){var k=this;h=(null!=h&&0<h.length?h.map(function(l){return k.points[l]}):this.points).map(function(l){return{metadata:l.metadata,index:l.index,vector:l.vector.slice(),projections:{}}});return new g(h,this.spriteAndMetadataInfo)};g.prototype.normalize=function(){var h=a.vector.centroid(this.points,
function(m){return m.vector});if(null==h)throw Error("centroid should not be null");for(var k=0;k<this.points.length;++k){var l=this.points[k];l.vector=a.vector.sub(l.vector,h);0<a.vector.norm2(l.vector)&&a.vector.unit(l.vector)}};g.prototype.projectLinear=function(h,k){this.projections[k]=!0;this.points.forEach(function(l){l.projections[k]=a.vector.dot(l.vector,h)})};g.prototype.projectPCA=function(){var h=this;return null!=this.projections["pca-0"]?Promise.resolve(null):a.util.runAsyncTask("Computing PCA...",
function(){var k=h.points[0].vector.length,l=h.shuffledDataIndices.map(function(r){return h.points[r].vector});k>a.PCA_SAMPLE_DIM&&(l=a.vector.projectRandom(l,a.PCA_SAMPLE_DIM));var m=l.slice(0,a.PCA_SAMPLE_SIZE),n=numeric.dot,q=numeric.transpose;k=numeric.svd;var p=numeric.div;n=n(q(m),m);m=p(n,m.length);m=k(m);p=m.S;for(k=n=0;k<p.length;++k)n+=p[k];for(k=0;k<p.length;++k)p[k]/=n;h.fracVariancesExplained=p;var t=m.U;l=l.map(function(r){for(var v=new Float32Array(10),u=0;10>u;u++){for(var w=0,x=0;x<
r.length;x++)w+=r[x]*t[x][u];v[u]=w}return v});for(m=0;10>m;m++)for(p="pca-"+m,h.projections[p]=!0,k=0;k<l.length;k++)h.points[h.shuffledDataIndices[k]].projections[p]=l[k][m]})};g.prototype.projectTSNE=function(h,k,l,m){function n(){if(q.tSNEShouldStop)q.projections.tsne=!1,m(null),q.tsne=null,q.hasTSNERun=!1;else{if(!q.tSNEShouldPause){q.tsne.step();var r=q.tsne.getSolution();t.forEach(function(v,u){v=q.points[v];v.projections["tsne-0"]=r[u*l];v.projections["tsne-1"]=r[u*l+1];3===l&&(v.projections["tsne-2"]=
r[u*l+2])});q.projections.tsne=!0;q.tSNEIteration++;m(q.tSNEIteration)}requestAnimationFrame(n)}}var q=this;this.hasTSNERun=!0;var p=Math.floor(3*h);this.tsne=new a.TSNE({epsilon:k,perplexity:h,dim:l});this.tsne.setSupervision(this.superviseLabels,this.superviseInput);this.tsne.setSuperviseFactor(this.superviseFactor);this.tSNEShouldStop=this.tSNEShouldPause=!1;this.tSNEIteration=0;var t=this.shuffledDataIndices.slice(0,a.TSNE_SAMPLE_SIZE);h=t.map(function(r){return q.points[r]});this.computeKnn(h,
p).then(function(r){q.nearest=r;a.util.runAsyncTask("Initializing T-SNE...",function(){q.tsne.initDataDist(q.nearest)}).then(n)})};g.prototype.projectUmap=function(h,k,l){xc(this,void 0,void 0,function(){var m,n,q,p,t,r,v,u=this;return yc(this,function(w){switch(w.label){case 0:return this.hasUmapRun=!0,this.umap=new UMAP({nComponents:h,nNeighbors:k}),m=0,n=10,q=this.shuffledDataIndices.slice(0,a.UMAP_SAMPLE_SIZE),p=q.map(function(x){return u.points[x]}),t=p.map(function(x){return Array.from(x.vector)}),
r=this,[4,this.computeKnn(p,k)];case 1:return r.nearest=w.sent(),[4,a.util.runAsyncTask("Initializing UMAP...",function(){var x=u.nearest.map(function(y){return y.map(function(B){return B.index})}),A=u.nearest.map(function(y){return y.map(function(B){return B.dist})});return u.umap.initializeFit(t,x,A)},"umap-optimization")];case 2:return v=w.sent(),[2,new Promise(function(x,A){function y(){for(var B=Math.min(n,v-m),F=0;F<B;F++)m=u.umap.step();a.util.runAsyncTask("Optimizing UMAP (epoch "+m+" of "+
v+")",function(){if(m<v)requestAnimationFrame(y);else{var K=u.umap.getEmbedding();q.forEach(function(L,N){L=u.points[L];L.projections["umap-0"]=K[N][0];L.projections["umap-1"]=K[N][1];3===h&&(L.projections["umap-2"]=K[N][2])});u.projections.umap=!0;a.logging.setModalMessage(null,"umap-optimization");u.hasUmapRun=!0;l(m);x()}},"umap-optimization",0).catch(function(K){a.logging.setModalMessage(null,"umap-optimization");A(K)})}requestAnimationFrame(y)})]}})})};g.prototype.computeKnn=function(h,k){return xc(this,
void 0,void 0,function(){var l;return yc(this,function(m){switch(m.label){case 0:return null!=this.nearest&&k<=this.nearest.length?[2,Promise.resolve(this.nearest)]:[3,1];case 1:return[4,d?a.knn.findKNNGPUCosine(h,k,function(n){return n.vector}):a.knn.findKNN(h,k,function(n){return n.vector},function(n,q){return a.vector.cosDistNorm(n,q)})];case 2:return this.nearest=l=m.sent(),[2,Promise.resolve(l)]}})})};g.prototype.perturbTsne=function(){var h=this;if(this.hasTSNERun&&this.tsne){this.tsne.perturb();
var k=this.tsne.getDim(),l=this.tsne.getSolution();this.shuffledDataIndices.slice(0,a.TSNE_SAMPLE_SIZE).forEach(function(m,n){m=h.points[m];m.projections["tsne-0"]=l[n*k];m.projections["tsne-1"]=l[n*k+1];3===k&&(m.projections["tsne-2"]=l[n*k+2])})}};g.prototype.setSupervision=function(h,k){var l=this;if(null!=h){var m=this.shuffledDataIndices.slice(0,a.TSNE_SAMPLE_SIZE),n=Array(m.length);m.forEach(function(q,p){return n[p]=l.points[q].metadata[h].toString()});this.superviseLabels=n}null!=k&&(this.superviseInput=
k);this.tsne&&this.tsne.setSupervision(this.superviseLabels,this.superviseInput)};g.prototype.setSuperviseFactor=function(h){null!=h&&(this.superviseFactor=h,this.tsne&&this.tsne.setSuperviseFactor(h))};g.prototype.mergeMetadata=function(h){var k=this;if(h.pointsInfo.length!==this.points.length){var l="Number of tensors ("+this.points.length+") do not match the number of lines in metadata"+(" ("+h.pointsInfo.length+").");if(1===h.stats.length&&this.points.length+1===h.pointsInfo.length)return a.logging.setErrorMessage(l+
" Single column metadata should not have a header row.","merging metadata"),!1;if(1<h.stats.length&&this.points.length-1===h.pointsInfo.length)return a.logging.setErrorMessage(l+" Multi-column metadata should have a header row with column labels.","merging metadata"),!1;a.logging.setWarningMessage(l)}this.spriteAndMetadataInfo=h;h.pointsInfo.slice(0,this.points.length).forEach(function(m,n){return k.points[n].metadata=m});return!0};g.prototype.stopTSNE=function(){this.tSNEShouldStop=!0};g.prototype.findNeighbors=
function(h,k,l){return a.knn.findKNNofPoint(this.points,h,l,function(m){return m.vector},k).slice(0,l)};g.prototype.query=function(h,k,l){var m=a.util.getSearchPredicate(h,k,l),n=[];this.points.forEach(function(q,p){m(q)&&n.push(p)});return n};return g}();a.DataSet=c;a.Projection=function(){return function(g,h,k,l){this.projectionType=g;this.projectionComponents=h;this.dimensionality=k;this.dataSet=l}}();a.State=function(){return function(){this.label="";this.isSelected=!1;this.tSNELearningRate=this.tSNEPerplexity=
this.tSNEIteration=0;this.umapIs3d=this.tSNEis3d=!0;this.umapNeighbors=15;this.pcaComponentDimensions=[];this.projections=[];this.selectedPoints=[]}}();a.getProjectionComponents=function(g,h){if(3<h.length)throw new RangeError("components length must be \x3c\x3d 3");var k=[null,null,null];g="custom"===g?"linear":g;for(var l=0;l<h.length;++l)null!=h[l]&&(k[l]=g+"-"+h[l]);return k};a.stateGetAccessorDimensions=function(g){switch(g.selectedProjection){case "pca":var h=g.pcaComponentDimensions.slice();
break;case "tsne":h=[0,1];g.tSNEis3d&&h.push(2);break;case "umap":h=[0,1];g.umapIs3d&&h.push(2);break;case "custom":h=["x","y"];break;default:throw Error("Unexpected fallthrough");}return h}})(wc);

// scatterPlotRectangleSelector.js
(function(a){var b=function(){function c(d,e){this.svgElement=d.querySelector("#selector");this.rectElement=document.createElementNS("http://www.w3.org/2000/svg","rect");this.rectElement.style.stroke="#aaaaaa";this.rectElement.style.strokeDasharray="10 5";this.rectElement.style.strokeWidth="2";this.rectElement.style.fill="#dddddd";this.rectElement.style.fillOpacity="0.2";this.svgElement.appendChild(this.rectElement);this.selectionCallback=e;this.isMouseDown=!1}c.prototype.onMouseDown=function(d,e){this.isMouseDown=
!0;this.rectElement.style.display="block";this.startCoordinates=[d,e];this.lastBoundingBox={x:this.startCoordinates[0],y:this.startCoordinates[1],width:1,height:1}};c.prototype.onMouseMove=function(d,e){this.isMouseDown&&(this.lastBoundingBox.x=Math.min(d,this.startCoordinates[0]),this.lastBoundingBox.y=Math.max(e,this.startCoordinates[1]),this.lastBoundingBox.width=Math.max(d,this.startCoordinates[0])-this.lastBoundingBox.x,this.lastBoundingBox.height=this.lastBoundingBox.y-Math.min(e,this.startCoordinates[1]),
this.rectElement.setAttribute("x",""+this.lastBoundingBox.x),this.rectElement.setAttribute("y",""+(this.lastBoundingBox.y-this.lastBoundingBox.height)),this.rectElement.setAttribute("width",""+this.lastBoundingBox.width),this.rectElement.setAttribute("height",""+this.lastBoundingBox.height))};c.prototype.onMouseUp=function(){this.isMouseDown=!1;this.rectElement.style.display="none";this.rectElement.setAttribute("width","0");this.rectElement.setAttribute("height","0");this.selectionCallback(this.lastBoundingBox)};
return c}();a.ScatterPlotRectangleSelector=b})(wc);

// renderContext.js
(function(a){a.LabelRenderParams=function(){return function(b,c,d,e,g,h,k){this.pointIndices=b;this.labelStrings=c;this.scaleFactors=d;this.useSceneOpacityFlags=e;this.defaultFontSize=g;this.fillColors=h;this.strokeColors=k}}();(function(b){b[b.Perspective=0]="Perspective";b[b.Orthographic=1]="Orthographic"})(a.CameraType||(a.CameraType={}));a.RenderContext=function(){return function(b,c,d,e,g,h,k,l,m,n,q,p,t,r){this.camera=b;this.cameraType=c;this.cameraTarget=d;this.screenWidth=e;this.screenHeight=
g;this.nearestCameraSpacePointZ=h;this.farthestCameraSpacePointZ=k;this.backgroundColor=l;this.pointColors=m;this.pointScaleFactors=n;this.labels=q;this.polylineColors=p;this.polylineOpacities=t;this.polylineWidths=r}}()})(wc);

// scatterPlot.js
(function(a){var b=new f.Vector3(.45,.9,1.6),c=new f.Vector3(0,0,0),d=new f.Vector3(0,0,4),e=new f.Vector3(0,0,0),g;(function(l){l[l.AREA_SELECT=0]="AREA_SELECT";l[l.CAMERA_AND_CLICK_SELECT=1]="CAMERA_AND_CLICK_SELECT"})(g=a.MouseMode||(a.MouseMode={}));var h=function(){return function(){this.orthographic=!1}}();a.CameraDef=h;var k=function(){function l(m,n){var q=this;this.container=m;this.projectorEventContext=n;this.visualizers=[];this.onCameraMoveListeners=[];this.backgroundColor=16777215;this.dimensionality=
3;this.cameraDef=null;this.isDragSequence=this.mouseIsDown=this.selecting=this.orbitAnimationOnNextCameraCreation=!1;this.getLayoutValues();this.scene=new f.Scene;this.renderer=new f.WebGLRenderer({alpha:!0,premultipliedAlpha:!1,antialias:!1});this.renderer.setClearColor(16777215,1);this.container.appendChild(this.renderer.domElement);this.light=new f.PointLight(16772287,1,0);this.scene.add(this.light);this.setDimensions(3);this.recreateCamera(this.makeDefaultCameraDef(this.dimensionality));this.renderer.render(this.scene,
this.camera);this.rectangleSelector=new a.ScatterPlotRectangleSelector(this.container,function(p){return q.selectBoundingBox(p)});this.addInteractionListeners()}l.prototype.addInteractionListeners=function(){this.container.addEventListener("mousemove",this.onMouseMove.bind(this));this.container.addEventListener("mousedown",this.onMouseDown.bind(this));this.container.addEventListener("mouseup",this.onMouseUp.bind(this));this.container.addEventListener("click",this.onClick.bind(this));window.addEventListener("keydown",
this.onKeyDown.bind(this),!1);window.addEventListener("keyup",this.onKeyUp.bind(this),!1)};l.prototype.addCameraControlsEventListeners=function(m){var n=this;m.addEventListener("start",function(){n.stopOrbitAnimation();n.onCameraMoveListeners.forEach(function(q){return q(n.camera.position,m.target)})});m.addEventListener("change",function(){n.render()});m.addEventListener("end",function(){})};l.prototype.makeOrbitControls=function(m,n,q){null!=this.orbitCameraControls&&this.orbitCameraControls.dispose();
var p=new f.OrbitControls(m,this.renderer.domElement);p.target0=new f.Vector3(n.target[0],n.target[1],n.target[2]);p.position0=(new f.Vector3).copy(m.position);p.zoom0=n.zoom;p.enableRotate=q;p.autoRotate=!1;p.rotateSpeed=1;q?(p.mouseButtons.ORBIT=f.MOUSE.LEFT,p.mouseButtons.PAN=f.MOUSE.RIGHT):(p.mouseButtons.ORBIT=null,p.mouseButtons.PAN=f.MOUSE.LEFT);p.reset();this.camera=m;this.orbitCameraControls=p;this.addCameraControlsEventListeners(this.orbitCameraControls)};l.prototype.makeCamera3D=function(m,
n,q){n=new f.PerspectiveCamera(70,n/q,.01,100);n.position.set(m.position[0],m.position[1],m.position[2]);n.lookAt(new f.Vector3(m.target[0],m.target[1],m.target[2]));n.zoom=m.zoom;n.updateProjectionMatrix();this.camera=n;this.makeOrbitControls(n,m,!0)};l.prototype.makeCamera2D=function(m,n,q){var p=new f.Vector3(m.target[0],m.target[1],m.target[2]);n/=q;q=-1.2;var t=1.2,r=-1.2,v=1.2;1<n?(q*=n,t*=n):(v/=n,r/=n);n=new f.OrthographicCamera(q,t,v,r,-1E3,1E3);n.position.set(m.position[0],m.position[1],
m.position[2]);n.up=new f.Vector3(0,1,0);n.lookAt(p);n.zoom=m.zoom;n.updateProjectionMatrix();this.camera=n;this.makeOrbitControls(n,m,!1)};l.prototype.makeDefaultCameraDef=function(m){var n=new h;n.orthographic=2===m;n.zoom=1;n.orthographic?(n.position=[d.x,d.y,d.z],n.target=[e.x,e.y,e.z]):(n.position=[b.x,b.y,b.z],n.target=[c.x,c.y,c.z]);return n};l.prototype.recreateCamera=function(m){m.orthographic?this.makeCamera2D(m,this.width,this.height):this.makeCamera3D(m,this.width,this.height);this.orbitCameraControls.minDistance=
.05;this.orbitCameraControls.maxDistance=10;this.orbitCameraControls.update();this.orbitAnimationOnNextCameraCreation&&this.startOrbitAnimation()};l.prototype.onClick=function(m,n){void 0===n&&(n=!0);m&&this.selecting||(!this.isDragSequence&&n&&this.projectorEventContext.notifySelectionChanged(null!=this.nearestPoint?[this.nearestPoint]:[]),this.isDragSequence=!1,this.render())};l.prototype.onMouseDown=function(m){this.isDragSequence=!1;this.mouseIsDown=!0;this.selecting?(this.orbitCameraControls.enabled=
!1,this.rectangleSelector.onMouseDown(m.offsetX,m.offsetY),this.setNearestPointToMouse(m)):!m.ctrlKey&&this.sceneIs3D()&&this.orbitCameraControls.mouseButtons.ORBIT===f.MOUSE.RIGHT?(this.orbitCameraControls.mouseButtons.ORBIT=f.MOUSE.LEFT,this.orbitCameraControls.mouseButtons.PAN=f.MOUSE.RIGHT):m.ctrlKey&&this.sceneIs3D()&&this.orbitCameraControls.mouseButtons.ORBIT===f.MOUSE.LEFT&&(this.orbitCameraControls.mouseButtons.ORBIT=f.MOUSE.RIGHT,this.orbitCameraControls.mouseButtons.PAN=f.MOUSE.LEFT)};
l.prototype.onMouseUp=function(){this.selecting&&(this.orbitCameraControls.enabled=!0,this.rectangleSelector.onMouseUp(),this.render());this.mouseIsDown=!1};l.prototype.onMouseMove=function(m){this.isDragSequence=this.mouseIsDown;this.selecting&&this.mouseIsDown?(this.rectangleSelector.onMouseMove(m.offsetX,m.offsetY),this.render()):this.mouseIsDown||(this.setNearestPointToMouse(m),this.projectorEventContext.notifyHoverOverPoint(this.nearestPoint))};l.prototype.onKeyDown=function(m){17===m.keyCode&&
this.sceneIs3D()&&(this.orbitCameraControls.mouseButtons.ORBIT=f.MOUSE.RIGHT,this.orbitCameraControls.mouseButtons.PAN=f.MOUSE.LEFT);16===m.keyCode&&(this.selecting=!0,this.container.style.cursor="crosshair")};l.prototype.onKeyUp=function(m){17===m.keyCode&&this.sceneIs3D()&&(this.orbitCameraControls.mouseButtons.ORBIT=f.MOUSE.LEFT,this.orbitCameraControls.mouseButtons.PAN=f.MOUSE.RIGHT);16===m.keyCode&&(this.selecting=this.getMouseMode()===g.AREA_SELECT,this.selecting||(this.container.style.cursor=
"default"),this.render())};l.prototype.getPointIndicesFromPickingTexture=function(m){if(null==this.worldSpacePointPositions)return null;var n=this.worldSpacePointPositions.length/3,q=window.devicePixelRatio||1,p=Math.floor(m.width*q),t=Math.floor(m.height*q),r=new Uint8Array(p*t*4);this.renderer.readRenderTargetPixels(this.pickingTexture,Math.floor(m.x*q),this.pickingTexture.height-Math.floor(m.y*q),p,t,r);m=new Uint8Array(this.worldSpacePointPositions.length);for(q=0;q<p*t;q++){var v=r[4*q]<<16|
r[4*q+1]<<8|r[4*q+2];16777215!==v&&v<n&&(m[v]=1)}n=[];for(q=0;q<m.length;q++)1===m[q]&&n.push(q);return n};l.prototype.selectBoundingBox=function(m){m=this.getPointIndicesFromPickingTexture(m);this.projectorEventContext.notifySelectionChanged(m)};l.prototype.setNearestPointToMouse=function(m){null==this.pickingTexture?this.nearestPoint=null:(m=this.getPointIndicesFromPickingTexture({x:m.offsetX,y:m.offsetY,width:1,height:1}),this.nearestPoint=null!=m?m[0]:null)};l.prototype.getLayoutValues=function(){this.width=
this.container.offsetWidth;this.height=Math.max(1,this.container.offsetHeight);return[this.width,this.height]};l.prototype.sceneIs3D=function(){return 3===this.dimensionality};l.prototype.remove3dAxisFromScene=function(){var m=this.scene.getObjectByName("axes");null!=m&&this.scene.remove(m);return m};l.prototype.add3dAxis=function(){var m=new f.AxisHelper;m.name="axes";this.scene.add(m)};l.prototype.setDimensions=function(m){if(2!==m&&3!==m)throw new RangeError("dimensionality must be 2 or 3");this.dimensionality=
m;var n=this.cameraDef||this.makeDefaultCameraDef(m);this.recreateCamera(n);this.remove3dAxisFromScene();3===m&&this.add3dAxis()};l.prototype.getCameraDef=function(){var m=new h,n=this.camera.position,q=this.orbitCameraControls.target;m.orthographic=!this.sceneIs3D();m.position=[n.x,n.y,n.z];m.target=[q.x,q.y,q.z];m.zoom=this.camera.zoom;return m};l.prototype.setCameraParametersForNextCameraCreation=function(m,n){this.cameraDef=m;this.orbitAnimationOnNextCameraCreation=n};l.prototype.getCameraPosition=
function(){var m=this.camera.position;return[m.x,m.y,m.z]};l.prototype.getCameraTarget=function(){var m=this.orbitCameraControls.target;return[m.x,m.y,m.z]};l.prototype.setCameraPositionAndTarget=function(m,n){this.stopOrbitAnimation();this.camera.position.set(m[0],m[1],m[2]);this.orbitCameraControls.target.set(n[0],n[1],n[2]);this.orbitCameraControls.update();this.render()};l.prototype.startOrbitAnimation=function(){this.sceneIs3D()&&(null!=this.orbitAnimationId&&this.stopOrbitAnimation(),this.orbitCameraControls.autoRotate=
!0,this.orbitCameraControls.rotateSpeed=7,this.updateOrbitAnimation())};l.prototype.updateOrbitAnimation=function(){var m=this;this.orbitCameraControls.update();this.orbitAnimationId=requestAnimationFrame(function(){return m.updateOrbitAnimation()})};l.prototype.stopOrbitAnimation=function(){this.orbitCameraControls.autoRotate=!1;this.orbitCameraControls.rotateSpeed=1;null!=this.orbitAnimationId&&(cancelAnimationFrame(this.orbitAnimationId),this.orbitAnimationId=null)};l.prototype.addVisualizer=function(m){this.scene&&
m.setScene(this.scene);m.onResize(this.width,this.height);m.onPointPositionsChanged(this.worldSpacePointPositions);this.visualizers.push(m)};l.prototype.removeAllVisualizers=function(){this.visualizers.forEach(function(m){return m.dispose()});this.visualizers=[]};l.prototype.setPointPositions=function(m){this.worldSpacePointPositions=m;this.visualizers.forEach(function(n){return n.onPointPositionsChanged(m)})};l.prototype.render=function(){var m=this.camera.position.clone();m.x+=1;m.y+=1;this.light.position.set(m.x,
m.y,m.z);m=this.camera instanceof f.PerspectiveCamera?a.CameraType.Perspective:a.CameraType.Orthographic;var n=[0,0];null!=this.worldSpacePointPositions&&(n=a.util.getNearFarPoints(this.worldSpacePointPositions,this.camera.position,this.orbitCameraControls.target));var q=new a.RenderContext(this.camera,m,this.orbitCameraControls.target,this.width,this.height,n[0],n[1],this.backgroundColor,this.pointColors,this.pointScaleFactors,this.labels,this.polylineColors,this.polylineOpacities,this.polylineWidths);
this.visualizers.forEach(function(p){return p.onPickingRender(q)});m=this.remove3dAxisFromScene();this.renderer.render(this.scene,this.camera,this.pickingTexture);null!=m&&this.scene.add(m);this.visualizers.forEach(function(p){return p.onRender(q)});this.renderer.render(this.scene,this.camera)};l.prototype.setMouseMode=function(m){this.mouseMode=m;m===g.AREA_SELECT?(this.selecting=!0,this.container.style.cursor="crosshair"):(this.selecting=!1,this.container.style.cursor="default")};l.prototype.setPointColors=
function(m){this.pointColors=m};l.prototype.setPointScaleFactors=function(m){this.pointScaleFactors=m};l.prototype.setLabels=function(m){this.labels=m};l.prototype.setPolylineColors=function(m){this.polylineColors=m};l.prototype.setPolylineOpacities=function(m){this.polylineOpacities=m};l.prototype.setPolylineWidths=function(m){this.polylineWidths=m};l.prototype.getMouseMode=function(){return this.mouseMode};l.prototype.resetZoom=function(){this.recreateCamera(this.makeDefaultCameraDef(this.dimensionality));
this.render()};l.prototype.setDayNightMode=function(m){var n=this.container.querySelectorAll("canvas");m=m?"invert(100%)":null;for(var q=0;q<n.length;q++)n[q].style.filter=m};l.prototype.resize=function(m){void 0===m&&(m=!0);var n=[this.width,this.height],q=n[0];n=n[1];var p=this.getLayoutValues(),t=p[0],r=p[1];3===this.dimensionality?(p=this.camera,p.aspect=t/r):(p=this.camera,q=t/q*(p.right-p.left)/2,n=r/n*(p.top-p.bottom)/2,p.top=n,p.bottom=-n,p.left=-q,p.right=q);p.updateProjectionMatrix();this.renderer.setPixelRatio();
this.renderer.setSize(t,r);q=this.renderer.getSize();n=this.renderer.getPixelRatio();this.pickingTexture=new f.WebGLRenderTarget(q.width*n,q.height*n);this.pickingTexture.texture.minFilter=f.LinearFilter;this.visualizers.forEach(function(v){return v.onResize(t,r)});m&&this.render()};l.prototype.onCameraMove=function(m){this.onCameraMoveListeners.push(m)};l.prototype.clickOnPoint=function(m){this.nearestPoint=m;this.onClick(null,!1)};return l}();a.ScatterPlot=k})(wc);

// scatterPlotVisualizerSprites.js
(function(a){var b="\n  // Index of the specific vertex (passed in as bufferAttribute), and the\n  // variable that will be used to pass it to the fragment shader.\n  attribute float spriteIndex;\n  attribute vec3 color;\n  attribute float scaleFactor;\n\n  varying vec2 xyIndex;\n  varying vec3 vColor;\n\n  uniform bool sizeAttenuation;\n  uniform float pointSize;\n  uniform float spritesPerRow;\n  uniform float spritesPerColumn;\n\n  void main() {\n    // Pass index and color values to fragment shader.\n    vColor \x3d color;\n    xyIndex \x3d vec2(mod(spriteIndex, spritesPerRow),\n              floor(spriteIndex / spritesPerColumn));\n\n    // Transform current vertex by modelViewMatrix (model world position and\n    // camera world position matrix).\n    vec4 cameraSpacePos \x3d modelViewMatrix * vec4(position, 1.0);\n\n    // Project vertex in camera-space to screen coordinates using the camera's\n    // projection matrix.\n    gl_Position \x3d projectionMatrix * cameraSpacePos;\n\n    // Create size attenuation (if we're in 3D mode) by making the size of\n    // each point inversly proportional to its distance to the camera.\n    float outputPointSize \x3d pointSize;\n    if (sizeAttenuation) {\n      outputPointSize \x3d -pointSize / cameraSpacePos.z;\n    } else {  // Create size attenuation (if we're in 2D mode)\n      const float PI \x3d 3.1415926535897932384626433832795;\n      const float minScale \x3d 0.1;  // minimum scaling factor\n      const float outSpeed \x3d 2.0;  // shrink speed when zooming out\n      const float outNorm \x3d (1. - minScale) / atan(outSpeed);\n      const float maxScale \x3d 15.0;  // maximum scaling factor\n      const float inSpeed \x3d 0.02;  // enlarge speed when zooming in\n      const float zoomOffset \x3d 0.3;  // offset zoom pivot\n      float zoom \x3d projectionMatrix[0][0] + zoomOffset;  // zoom pivot\n      float scale \x3d zoom \x3c 1. ? 1. + outNorm * atan(outSpeed * (zoom - 1.)) :\n                    1. + 2. / PI * (maxScale - 1.) * atan(inSpeed * (zoom - 1.));\n      outputPointSize \x3d pointSize * scale;\n    }\n\n    gl_PointSize \x3d\n      max(outputPointSize * scaleFactor, "+
(5).toFixed(1)+");\n  }",c="\n  varying vec2 xyIndex;\n  varying vec3 vColor;\n\n  uniform sampler2D texture;\n  uniform float spritesPerRow;\n  uniform float spritesPerColumn;\n  uniform bool isImage;\n\n  "+f.ShaderChunk.common+"\n  "+f.ShaderChunk.fog_pars_fragment+"\n  \n  bool point_in_unit_circle(vec2 spriteCoord) {\n    vec2 centerToP \x3d spriteCoord - vec2(0.5, 0.5);\n    return dot(centerToP, centerToP) \x3c (0.5 * 0.5);\n  }\n\n  bool point_in_unit_equilateral_triangle(vec2 spriteCoord) {\n    vec3 v0 \x3d vec3(0, 1, 0);\n    vec3 v1 \x3d vec3(0.5, 0, 0);\n    vec3 v2 \x3d vec3(1, 1, 0);\n    vec3 p \x3d vec3(spriteCoord, 0);\n    float p_in_v0_v1 \x3d cross(v1 - v0, p - v0).z;\n    float p_in_v1_v2 \x3d cross(v2 - v1, p - v1).z;\n    return (p_in_v0_v1 \x3e 0.0) \x26\x26 (p_in_v1_v2 \x3e 0.0);\n  }\n\n  bool point_in_unit_square(vec2 spriteCoord) {\n    return true;\n  }\n\n\n  void main() {\n    if (isImage) {\n      // Coordinates of the vertex within the entire sprite image.\n      vec2 coords \x3d\n        (gl_PointCoord + xyIndex) / vec2(spritesPerRow, spritesPerColumn);\n      gl_FragColor \x3d vec4(vColor, 1.0) * texture2D(texture, coords);\n    } else {\n      bool inside \x3d point_in_unit_circle(gl_PointCoord);\n      if (!inside) {\n        discard;\n      }\n      gl_FragColor \x3d vec4(vColor, 1);\n    }\n    "+
f.ShaderChunk.fog_fragment+"\n  }",d=function(){function e(){this.texture=null;this.standinTextureForPoints=a.util.createTexture(document.createElement("canvas"));this.renderMaterial=this.createRenderMaterial(!1);this.pickingMaterial=this.createPickingMaterial()}e.prototype.createTextureFromSpriteAtlas=function(g,h,k){this.texture=a.util.createTexture(g);this.spritesPerRow=g.width/h[0];this.spritesPerColumn=g.height/h[1];this.spriteDimensions=h;this.spriteIndexBufferAttribute=new f.BufferAttribute(k,
1);null!=this.points&&this.points.geometry.addAttribute("spriteIndex",this.spriteIndexBufferAttribute)};e.prototype.createUniforms=function(){return{texture:{type:"t"},spritesPerRow:{type:"f"},spritesPerColumn:{type:"f"},fogColor:{type:"c"},fogNear:{type:"f"},fogFar:{type:"f"},isImage:{type:"bool"},sizeAttenuation:{type:"bool"},pointSize:{type:"f"}}};e.prototype.createRenderMaterial=function(g){return new f.ShaderMaterial({uniforms:this.createUniforms(),vertexShader:b,fragmentShader:c,transparent:!g,
depthTest:g,depthWrite:g,fog:!0,blending:f.MultiplyBlending})};e.prototype.createPickingMaterial=function(){return new f.ShaderMaterial({uniforms:this.createUniforms(),vertexShader:b,fragmentShader:"\n  varying vec2 xyIndex;\n  varying vec3 vColor;\n  uniform bool isImage;\n\n  \n  bool point_in_unit_circle(vec2 spriteCoord) {\n    vec2 centerToP \x3d spriteCoord - vec2(0.5, 0.5);\n    return dot(centerToP, centerToP) \x3c (0.5 * 0.5);\n  }\n\n  bool point_in_unit_equilateral_triangle(vec2 spriteCoord) {\n    vec3 v0 \x3d vec3(0, 1, 0);\n    vec3 v1 \x3d vec3(0.5, 0, 0);\n    vec3 v2 \x3d vec3(1, 1, 0);\n    vec3 p \x3d vec3(spriteCoord, 0);\n    float p_in_v0_v1 \x3d cross(v1 - v0, p - v0).z;\n    float p_in_v1_v2 \x3d cross(v2 - v1, p - v1).z;\n    return (p_in_v0_v1 \x3e 0.0) \x26\x26 (p_in_v1_v2 \x3e 0.0);\n  }\n\n  bool point_in_unit_square(vec2 spriteCoord) {\n    return true;\n  }\n\n\n  void main() {\n    xyIndex; // Silence 'unused variable' warning.\n    if (isImage) {\n      gl_FragColor \x3d vec4(vColor, 1);\n    } else {\n      bool inside \x3d point_in_unit_circle(gl_PointCoord);\n      if (!inside) {\n        discard;\n      }\n      gl_FragColor \x3d vec4(vColor, 1);\n    }\n  }",
transparent:!0,depthTest:!0,depthWrite:!0,fog:!1,blending:f.NormalBlending})};e.prototype.createPointSprites=function(g,h){h=this.createGeometry(null!=h?h.length/3:0);this.fog=new f.Fog(16777215);this.points=new f.Points(h,this.renderMaterial);this.points.frustumCulled=!1;null!=this.spriteIndexBufferAttribute&&this.points.geometry.addAttribute("spriteIndex",this.spriteIndexBufferAttribute);g.add(this.points)};e.prototype.calculatePointSize=function(g){if(null!=this.texture)return g?30:this.spriteDimensions[0];
var h=200/Math.log(null!=this.worldSpacePointPositions?this.worldSpacePointPositions.length/3:1)/Math.log(8);return g?h:h/1.5};e.prototype.createGeometry=function(g){this.pickingColors=new Float32Array(3*g);for(var h=0,k=0;k<g;k++){var l=new f.Color(k);this.pickingColors[h++]=l.r;this.pickingColors[h++]=l.g;this.pickingColors[h++]=l.b}g=new f.BufferGeometry;g.addAttribute("position",new f.BufferAttribute(null,3));g.addAttribute("color",new f.BufferAttribute(null,3));g.addAttribute("scaleFactor",new f.BufferAttribute(null,
1));return g};e.prototype.setFogDistances=function(g,h,k){g?(g=this.worldSpacePointPositions.length/3,this.fog.near=h,this.fog.far=k*(2-Math.min(g,5E3)/5E3)):(this.fog.near=Infinity,this.fog.far=Infinity)};e.prototype.dispose=function(){this.disposeGeometry();this.disposeTextureAtlas()};e.prototype.disposeGeometry=function(){null!=this.points&&(this.scene.remove(this.points),this.points.geometry.dispose(),this.worldSpacePointPositions=this.points=null)};e.prototype.disposeTextureAtlas=function(){null!=
this.texture&&this.texture.dispose();this.pickingMaterial=this.renderMaterial=this.texture=null};e.prototype.setScene=function(g){this.scene=g};e.prototype.setSpriteAtlas=function(g,h,k){this.disposeTextureAtlas();this.createTextureFromSpriteAtlas(g,h,k);this.renderMaterial=this.createRenderMaterial(!0);this.pickingMaterial=this.createPickingMaterial()};e.prototype.clearSpriteAtlas=function(){this.disposeTextureAtlas();this.renderMaterial=this.createRenderMaterial(!1);this.pickingMaterial=this.createPickingMaterial()};
e.prototype.onPointPositionsChanged=function(g){if(null==g||0===g.length)this.dispose();else{null!=this.points&&this.worldSpacePointPositions.length!==g.length&&this.disposeGeometry();this.worldSpacePointPositions=g;null==this.points&&this.createPointSprites(this.scene,g);var h=this.points.geometry.getAttribute("position");h.array=g;h.needsUpdate=!0}};e.prototype.onPickingRender=function(g){if(null!=this.points){var h=g.cameraType===a.CameraType.Perspective;this.pickingMaterial.uniforms.spritesPerRow.value=
this.spritesPerRow;this.pickingMaterial.uniforms.spritesPerRow.value=this.spritesPerColumn;this.pickingMaterial.uniforms.sizeAttenuation.value=h;this.pickingMaterial.uniforms.pointSize.value=this.calculatePointSize(h);this.points.material=this.pickingMaterial;h=this.points.geometry.getAttribute("color");h.array=this.pickingColors;h.needsUpdate=!0;h=this.points.geometry.getAttribute("scaleFactor");h.array=g.pointScaleFactors;h.needsUpdate=!0}};e.prototype.onRender=function(g){if(this.points){var h=
g.camera instanceof f.PerspectiveCamera;this.setFogDistances(h,g.nearestCameraSpacePointZ,g.farthestCameraSpacePointZ);this.scene.fog=this.fog;this.scene.fog.color=new f.Color(g.backgroundColor);this.renderMaterial.uniforms.fogColor.value=this.scene.fog.color;this.renderMaterial.uniforms.fogNear.value=this.fog.near;this.renderMaterial.uniforms.fogFar.value=this.fog.far;this.renderMaterial.uniforms.spritesPerRow.value=this.spritesPerRow;this.renderMaterial.uniforms.spritesPerColumn.value=this.spritesPerColumn;
this.renderMaterial.uniforms.isImage.value=null!=this.texture;this.renderMaterial.uniforms.texture.value=null!=this.texture?this.texture:this.standinTextureForPoints;this.renderMaterial.uniforms.sizeAttenuation.value=h;this.renderMaterial.uniforms.pointSize.value=this.calculatePointSize(h);this.points.material=this.renderMaterial;h=this.points.geometry.getAttribute("color");this.renderColors=g.pointColors;h.array=this.renderColors;h.needsUpdate=!0;h=this.points.geometry.getAttribute("scaleFactor");
h.array=g.pointScaleFactors;h.needsUpdate=!0}};e.prototype.onResize=function(){};return e}();a.ScatterPlotVisualizerSprites=d})(wc);

// label.js
(function(a){var b=function(){function c(d,e,g){this.bound=d;this.cellWidth=e;this.cellHeight=g;this.numHorizCells=Math.ceil(this.boundWidth(d)/e);this.numVertCells=Math.ceil(this.boundHeight(d)/g);this.grid=Array(this.numHorizCells*this.numVertCells)}c.prototype.boundWidth=function(d){return d.hiX-d.loX};c.prototype.boundHeight=function(d){return d.hiY-d.loY};c.prototype.boundsIntersect=function(d,e){return!(d.loX>e.hiX||d.loY>e.hiY||d.hiX<e.loX||d.hiY<e.loY)};c.prototype.insert=function(d,e){void 0===
e&&(e=!1);if(d.hiX<this.bound.loX||d.loX>this.bound.hiX||d.hiY<this.bound.loY||d.loY>this.bound.hiY)return!1;for(var g=this.getCellX(d.loX),h=this.getCellX(d.hiX),k=this.getCellY(d.loY),l=this.getCellY(d.hiY),m=k*this.numHorizCells+g,n=m,q=k;q<=l;q++){for(var p=g;p<=h;p++){var t=this.grid[n++];if(t)for(var r=0;r<t.length;r++)if(this.boundsIntersect(d,t[r]))return!1}n+=this.numHorizCells-(h-g+1)}if(e)return!0;n=m;for(q=k;q<=l;q++){for(p=g;p<=h;p++)this.grid[n]?this.grid[n].push(d):this.grid[n]=[d],
n++;n+=this.numHorizCells-(h-g+1)}return!0};c.prototype.getCellX=function(d){return Math.floor((d-this.bound.loX)/this.cellWidth)};c.prototype.getCellY=function(d){return Math.floor((d-this.bound.loY)/this.cellHeight)};return c}();a.CollisionGrid=b})(wc);

// scatterPlotVisualizerCanvasLabels.js
(function(a){var b=function(){function c(d){this.labelsActive=!0;this.canvas=document.createElement("canvas");d.appendChild(this.canvas);this.gc=this.canvas.getContext("2d");this.canvas.style.position="absolute";this.canvas.style.left="0";this.canvas.style.top="0";this.canvas.style.pointerEvents="none"}c.prototype.removeAllLabels=function(){this.gc.clearRect(0,0,this.canvas.width*window.devicePixelRatio,this.canvas.height*window.devicePixelRatio)};c.prototype.makeLabels=function(d){if(null!=d.labels&&
0!==d.labels.pointIndices.length&&null!=this.worldSpacePointPositions){var e=d.labels,g=d.cameraType===a.CameraType.Perspective,h=parseInt(this.gc.font,10),k=window.devicePixelRatio;var l=this.canvas.width*k;var m=this.canvas.height*k;l=new a.CollisionGrid({loX:0,hiX:l,loY:0,hiY:m},l/25,m/50);m=d3.scalePow().exponent(Math.E).domain([d.farthestCameraSpacePointZ,d.nearestCameraSpacePointZ]).range([.1,1]);var n=d.camera.position,q=n.clone().sub(d.cameraTarget),p=new f.Vector3;this.gc.textBaseline="middle";
this.gc.miterLimit=2;for(var t=Math.min(1E4,e.pointIndices.length),r=0;r<t;++r){var v=a.util.vector3FromPackedArray(this.worldSpacePointPositions,e.pointIndices[r]);p.copy(n).sub(v);if(!(0>q.dot(p))){var u=a.util.vector3DToScreenCoords(d.camera,d.screenWidth,d.screenHeight,v);v=u[0];u=u[1];v+=4;var w={loX:v-2,hiX:v+1+2,loY:u-h/2-2,hiY:u+h/2+2};if(l.insert(w,!0)){var x=e.labelStrings[r];this.gc.font=e.defaultFontSize*e.scaleFactors[r]*k+"px roboto";w.hiX+=this.gc.measureText(x).width-1;l.insert(w)&&
(w=1,g&&1===e.useSceneOpacityFlags[r]&&(w=m(p.length())),this.gc.fillStyle=this.styleStringFromPackedRgba(e.fillColors,r,w),this.gc.strokeStyle=this.styleStringFromPackedRgba(e.strokeColors,r,w),this.gc.lineWidth=3,this.gc.strokeText(x,v,u),this.gc.lineWidth=6,this.gc.fillText(x,v,u))}}}}};c.prototype.styleStringFromPackedRgba=function(d,e,g){e*=3;return"rgba("+d[e]+","+d[e+1]+","+d[e+2]+","+g+")"};c.prototype.onResize=function(d,e){var g=window.devicePixelRatio;this.canvas.width=d*g;this.canvas.height=
e*g;this.canvas.style.width=d+"px";this.canvas.style.height=e+"px"};c.prototype.dispose=function(){this.removeAllLabels();this.gc=this.canvas=null};c.prototype.onPointPositionsChanged=function(d){this.worldSpacePointPositions=d;this.removeAllLabels()};c.prototype.onRender=function(d){this.labelsActive&&(this.removeAllLabels(),this.makeLabels(d))};c.prototype.setScene=function(){};c.prototype.onPickingRender=function(){};return c}();a.ScatterPlotVisualizerCanvasLabels=b})(wc);

// scatterPlotVisualizerPolylines.js
(function(a){var b=function(){function c(){this.polylinePositionBuffer={};this.polylineColorBuffer={}}c.prototype.updateSequenceIndicesInDataSet=function(d){for(var e=0;e<d.sequences.length;e++)for(var g=d.sequences[e],h=0;h<g.pointIndices.length-1;h++)d.points[g.pointIndices[h]].sequenceIndex=e,d.points[g.pointIndices[h+1]].sequenceIndex=e};c.prototype.createPolylines=function(d){if(this.dataSet&&this.dataSet.sequences){this.updateSequenceIndicesInDataSet(this.dataSet);this.polylines=[];for(var e=
0;e<this.dataSet.sequences.length;e++){var g=new f.BufferGeometry;g.addAttribute("position",this.polylinePositionBuffer[e]);g.addAttribute("color",this.polylineColorBuffer[e]);var h=new f.LineBasicMaterial({linewidth:1,opacity:1,transparent:!0,vertexColors:f.VertexColors});g=new f.LineSegments(g,h);g.frustumCulled=!1;this.polylines.push(g);d.add(g)}}};c.prototype.dispose=function(){if(null!=this.polylines){for(var d=0;d<this.polylines.length;d++)this.scene.remove(this.polylines[d]),this.polylines[d].geometry.dispose();
this.polylines=null;this.polylinePositionBuffer={};this.polylineColorBuffer={}}};c.prototype.setScene=function(d){this.scene=d};c.prototype.setDataSet=function(d){this.dataSet=d};c.prototype.onPointPositionsChanged=function(d){null!=d&&null==this.polylines||this.dispose();if(null!=d&&null!=this.dataSet){for(var e=0;e<this.dataSet.sequences.length;e++){var g=this.dataSet.sequences[e];g=2*(g.pointIndices.length-1);this.polylinePositionBuffer[e]=new f.BufferAttribute(new Float32Array(3*g),3);this.polylineColorBuffer[e]=
new f.BufferAttribute(new Float32Array(3*g),3)}for(e=0;e<this.dataSet.sequences.length;e++){g=this.dataSet.sequences[e];for(var h=0,k=0;k<g.pointIndices.length-1;k++){var l=a.util.vector3FromPackedArray(d,g.pointIndices[k]),m=a.util.vector3FromPackedArray(d,g.pointIndices[k+1]);this.polylinePositionBuffer[e].setXYZ(h,l.x,l.y,l.z);this.polylinePositionBuffer[e].setXYZ(h+1,m.x,m.y,m.z);h+=2}this.polylinePositionBuffer[e].needsUpdate=!0}null==this.polylines&&this.createPolylines(this.scene)}};c.prototype.onRender=
function(d){if(null!=this.polylines)for(var e=0;e<this.polylines.length;e++)this.polylines[e].material.opacity=d.polylineOpacities[e],this.polylines[e].material.linewidth=d.polylineWidths[e],this.polylineColorBuffer[e].array=d.polylineColors[e],this.polylineColorBuffer[e].needsUpdate=!0};c.prototype.onPickingRender=function(){};c.prototype.onResize=function(){};return c}();a.ScatterPlotVisualizerPolylines=b})(wc);

// projectorScatterPlotAdapter.js
(function(a){function b(l,m,n,q,p){l[3*m]=n;l[3*m+1]=q;l[3*m+2]=p}function c(l){l=new f.Color(l);return[255*l.r|0,255*l.g|0,255*l.b|0]}function d(l,m){l=d3.hsl(60+300*l/m,1,.3).rgb();return new f.Color(l.r/255,l.g/255,l.b/255)}function e(l,m,n){return l===a.vector.dist?n/m:1-m}function g(l,m,n){return h(e(l,m,n))}var h=d3.scaleLinear().domain([1,.7,.4]).range(["hsl(285, 80%, 40%)","hsl(0, 80%, 65%)","hsl(40, 70%, 60%)"]).clamp(!0),k=function(){function l(m,n){var q=this;this.scatterPlotContainer=
m;this.renderLabelsIn3D=!1;this.scatterPlot=new a.ScatterPlot(m,n);n.registerProjectionChangedListener(function(p){q.projection=p;q.updateScatterPlotWithNewProjection(p)});n.registerSelectionChangedListener(function(p,t){q.selectedPointIndices=p;q.neighborsOfFirstSelectedPoint=t;q.updateScatterPlotPositions();q.updateScatterPlotAttributes();q.scatterPlot.render()});n.registerHoverListener(function(p){q.hoverPointIndex=p;q.updateScatterPlotAttributes();q.scatterPlot.render()});n.registerDistanceMetricChangedListener(function(p){q.distanceMetric=
p;q.updateScatterPlotAttributes();q.scatterPlot.render()});this.createVisualizers(!1)}l.prototype.notifyProjectionPositionsUpdated=function(){this.updateScatterPlotPositions();this.scatterPlot.render()};l.prototype.setDataSet=function(m){null!=this.projection&&(this.projection.dataSet=m);null!=this.polylineVisualizer&&this.polylineVisualizer.setDataSet(m);null!=this.labels3DVisualizer&&this.labels3DVisualizer.setLabelStrings(this.generate3DLabelsArray(m,this.labelPointAccessor));if(null!=this.spriteVisualizer&&
(this.spriteVisualizer.clearSpriteAtlas(),null!=m&&null!=m.spriteAndMetadataInfo)){var n=m.spriteAndMetadataInfo;if(null!=n.spriteImage&&null!=n.spriteMetadata){for(var q=m.points.length,p=new Float32Array(q),t=0;t<q;++t)p[t]=m.points[t].index;this.spriteVisualizer.setSpriteAtlas(n.spriteImage,n.spriteMetadata.singleImageDim,p)}}};l.prototype.set3DLabelMode=function(m){this.renderLabelsIn3D=m;this.createVisualizers(m);this.updateScatterPlotAttributes();this.scatterPlot.render()};l.prototype.setLegendPointColorer=
function(m){this.legendPointColorer=m};l.prototype.setLabelPointAccessor=function(m){this.labelPointAccessor=m;null!=this.labels3DVisualizer&&this.labels3DVisualizer.setLabelStrings(this.generate3DLabelsArray(null==this.projection?null:this.projection.dataSet,m))};l.prototype.resize=function(){this.scatterPlot.resize()};l.prototype.populateBookmarkFromUI=function(m){m.cameraDef=this.scatterPlot.getCameraDef()};l.prototype.restoreUIFromBookmark=function(m){this.scatterPlot.setCameraParametersForNextCameraCreation(m.cameraDef,
!1)};l.prototype.updateScatterPlotPositions=function(){var m=this.generatePointPositionArray(null==this.projection?null:this.projection.dataSet,null==this.projection?null:this.projection.projectionComponents);this.scatterPlot.setPointPositions(m)};l.prototype.updateScatterPlotAttributes=function(){if(null!=this.projection){var m=this.projection.dataSet,n=this.selectedPointIndices,q=this.hoverPointIndex,p=this.neighborsOfFirstSelectedPoint,t=this.legendPointColorer,r=this.generatePointColorArray(m,
t,this.distanceMetric,n,p,q,this.renderLabelsIn3D,this.getSpriteImageMode()),v=this.generatePointScaleFactorArray(m,n,p,q);q=this.generateVisibleLabelRenderParams(m,n,p,q);t=this.generateLineSegmentColorMap(m,t);p=this.generateLineSegmentOpacityArray(m,n);m=this.generateLineSegmentWidthArray(m,n);this.scatterPlot.setPointColors(r);this.scatterPlot.setPointScaleFactors(v);this.scatterPlot.setLabels(q);this.scatterPlot.setPolylineColors(t);this.scatterPlot.setPolylineOpacities(p);this.scatterPlot.setPolylineWidths(m)}};
l.prototype.render=function(){this.scatterPlot.render()};l.prototype.generatePointPositionArray=function(m,n){if(null==m)return null;var q=d3.scaleLinear(),p=d3.scaleLinear(),t=null,r=d3.extent(m.points,function(A,y){return m.points[y].projections[n[0]]}),v=d3.extent(m.points,function(A,y){return m.points[y].projections[n[1]]}),u=[-1,1];q.domain(r).range(u);p.domain(v).range(u);null!=n[2]&&(r=d3.extent(m.points,function(A,y){return m.points[y].projections[n[2]]}),t=d3.scaleLinear(),t.domain(r).range(u));
var w=new Float32Array(3*m.points.length),x=0;m.points.forEach(function(A,y){w[x++]=q(m.points[y].projections[n[0]]);w[x++]=p(m.points[y].projections[n[1]]);w[x++]=0});t&&(x=2,m.points.forEach(function(A,y){w[x]=t(m.points[y].projections[n[2]]);x+=3}));return w};l.prototype.generateVisibleLabelRenderParams=function(m,n,q,p){if(null==m)return null;var t=null==n?0:n.length,r=null==q?0:q.length,v=t+r+(null!=p?1:0),u=new Uint32Array(v),w=new Float32Array(v),x=new Int8Array(v),A=new Uint8Array(3*v);v=
new Uint8Array(3*v);var y=[];w.fill(1);x.fill(1);var B=0;if(null!=p){y.push(this.getLabelText(m,p,this.labelPointAccessor));u[B]=p;w[B]=2;x[B]=0;p=c(0);b(A,B,p[0],p[1],p[2]);var F=c(16777215);b(v,B,F[0],F[1],F[1]);++B}p=c(0);F=c(16777215);for(var K=0;K<t;++K){var L=n[K];y.push(this.getLabelText(m,L,this.labelPointAccessor));u[B]=L;w[B]=2;x[B]=1===t?0:1;b(A,B,p[0],p[1],p[2]);b(v,B,F[0],F[1],F[2]);++B}p=c(0);F=c(16777215);for(K=0;K<r;++K)L=q[K].index,y.push(this.getLabelText(m,L,this.labelPointAccessor)),
u[B]=L,b(A,B,p[0],p[1],p[2]),b(v,B,F[0],F[1],F[2]),++B;return new a.LabelRenderParams(new Float32Array(u),y,w,x,10,A,v)};l.prototype.generatePointScaleFactorArray=function(m,n,q,p){if(null==m)return new Float32Array(0);m=new Float32Array(m.points.length);m.fill(1);for(var t=null==q?0:q.length,r=null==n?0:n.length,v=0;v<r;++v){var u=n[v];m[u]=1.2}r=t;for(v=0;v<r;++v)u=q[v].index,m[u]=1.2;null!=p&&(m[p]=1.2);return m};l.prototype.generateLineSegmentColorMap=function(m,n){var q={};if(null==m)return q;
for(var p=0;p<m.sequences.length;p++){var t=m.sequences[p],r=new Float32Array(6*(t.pointIndices.length-1)),v=0;if(n)for(var u=0;u<t.pointIndices.length-1;u++){var w=new f.Color(n(m,t.pointIndices[u])),x=new f.Color(n(m,t.pointIndices[u+1]));r[v++]=w.r;r[v++]=w.g;r[v++]=w.b;r[v++]=x.r;r[v++]=x.g;r[v++]=x.b}else for(u=0;u<t.pointIndices.length-1;u++)w=d(u,t.pointIndices.length),x=d(u+1,t.pointIndices.length),r[v++]=w.r,r[v++]=w.g,r[v++]=w.b,r[v++]=x.r,r[v++]=x.g,r[v++]=x.b;q[p]=r}return q};l.prototype.generateLineSegmentOpacityArray=
function(m,n){if(null==m)return new Float32Array(0);var q=new Float32Array(m.sequences.length);0<(null==n?0:n.length)?(q.fill(.05),q[m.points[n[0]].sequenceIndex]=.9):q.fill(.2);return q};l.prototype.generateLineSegmentWidthArray=function(m,n){if(null==m)return new Float32Array(0);var q=new Float32Array(m.sequences.length);q.fill(2);0<(null==n?0:n.length)&&(q[m.points[n[0]].sequenceIndex]=3);return q};l.prototype.generatePointColorArray=function(m,n,q,p,t,r,v,u){if(null==m)return new Float32Array(0);
var w=null==p?0:p.length,x=null==t?0:t.length,A=new Float32Array(3*m.points.length),y=14935011,B=7697881;v&&(B=y=16777215);u&&(B=y=16777215);v=m.points.length;u=0;if(0<w)for(y=new f.Color(y),B=0;B<v;++B)A[u++]=y.r,A[u++]=y.g,A[u++]=y.b;else if(null!=n)for(B=0;B<v;++B)y=new f.Color(n(m,B)),A[u++]=y.r,A[u++]=y.g,A[u++]=y.b;else for(y=new f.Color(B),B=0;B<v;++B)A[u++]=y.r,A[u++]=y.g,A[u++]=y.b;v=w;y=new f.Color(16410214);for(B=0;B<v;++B)u=3*p[B],A[u++]=y.r,A[u++]=y.g,A[u++]=y.b;v=x;m=0<v?t[0].dist:0;
for(B=0;B<v;++B)y=new f.Color(g(q,t[B].dist,m)),u=3*t[B].index,A[u++]=y.r,A[u++]=y.g,A[u++]=y.b;null!=r&&(y=new f.Color(7736143),u=3*r,A[u++]=y.r,A[u++]=y.g,A[u++]=y.b);return A};l.prototype.generate3DLabelsArray=function(m,n){if(null==m||null==n)return null;for(var q=[],p=m.points.length,t=0;t<p;++t)q.push(this.getLabelText(m,t,n));return q};l.prototype.getLabelText=function(m,n,q){return m.points[n].metadata[q].toString()};l.prototype.updateScatterPlotWithNewProjection=function(m){null==m?(this.createVisualizers(this.renderLabelsIn3D),
this.scatterPlot.render()):(this.setDataSet(m.dataSet),this.scatterPlot.setDimensions(m.dimensionality),m.dataSet.projectionCanBeRendered(m.projectionType)&&(this.updateScatterPlotAttributes(),this.notifyProjectionPositionsUpdated()),this.scatterPlot.setCameraParametersForNextCameraCreation(null,!1))};l.prototype.createVisualizers=function(m){var n=null==this.projection?null:this.projection.dataSet,q=this.scatterPlot;q.removeAllVisualizers();this.polylineVisualizer=this.spriteVisualizer=this.canvasLabelsVisualizer=
this.labels3DVisualizer=null;m?(this.labels3DVisualizer=new a.ScatterPlotVisualizer3DLabels,this.labels3DVisualizer.setLabelStrings(this.generate3DLabelsArray(n,this.labelPointAccessor))):(this.spriteVisualizer=new a.ScatterPlotVisualizerSprites,q.addVisualizer(this.spriteVisualizer),this.canvasLabelsVisualizer=new a.ScatterPlotVisualizerCanvasLabels(this.scatterPlotContainer));this.polylineVisualizer=new a.ScatterPlotVisualizerPolylines;this.setDataSet(n);this.spriteVisualizer&&q.addVisualizer(this.spriteVisualizer);
this.labels3DVisualizer&&q.addVisualizer(this.labels3DVisualizer);this.canvasLabelsVisualizer&&q.addVisualizer(this.canvasLabelsVisualizer);q.addVisualizer(this.polylineVisualizer)};l.prototype.getSpriteImageMode=function(){if(null==this.projection)return!1;var m=this.projection.dataSet;return null==m||null==m.spriteAndMetadataInfo?!1:null!=m.spriteAndMetadataInfo.spriteImage};return l}();a.ProjectorScatterPlotAdapter=k;a.normalizeDist=e;a.dist2color=g;wc.debug=this.polylineVisualizer;})(wc);

function isElement(obj) {
    try {
        //Using W3 DOM2 (works for FF, Opera and Chrome)
        return obj instanceof HTMLElement;
    }
    catch(e){
        //Browsers not supporting W3 DOM2 don't have HTMLElement and
        //an exception is thrown and we end up here. Testing some
        //properties that all elements have (works on IE7)
        return (typeof obj==="object") &&
            (obj.nodeType===1) && (typeof obj.style === "object") &&
            (typeof obj.ownerDocument ==="object");
    }
}

// handler
function EventHandler() {
    this.lhover = [];
    this.lselect = [];
    this.lproj = [];
    this.lmetric = [];
    this.lmeta = [];

    this.dataset = null;
    this.distFunc = wc.vector.cosDist;
    this.numNN = 5;
}

EventHandler.prototype.registerHoverListener = function(l) {
    this.lhover.push(l);
}

EventHandler.prototype.notifyHoverOverPoint = function(p) {
    this.lhover.forEach(function(l) { l(p); });
}

EventHandler.prototype.registerSelectionChangedListener = function(l) {
    this.lselect.push(l);
}

EventHandler.prototype.notifySelectionChanged = function(p) {
    var neighbors = [];
    if (p.length === 1 && this.dataset !== null) {
        neighbors = this.dataset.findNeighbors(
            p[0],
            this.distFunc,
            this.numNN
        );
        this.notifyMetaChanged(
            this.dataset.points[p[0]].metadata
        );
    } else {
        this.notifyMetaChanged( null );
    }
    this.lselect.forEach(function(l){l(p, neighbors)});
}

EventHandler.prototype.registerProjectionChangedListener = function(l) {
    this.lproj.push(l);
}

EventHandler.prototype.notifyProjectionChanged = function(p) {
    this.lproj.forEach(function(l){l(p);})
}

EventHandler.prototype.registerDistanceMetricChangedListener = function(l) {
    this.lmetric.push(l);
}

EventHandler.prototype.notifyDistanceMetricChanged = function(p) {
    this.distFunc = p;
    this.lmetric.forEach(function(l){l(p);})
}

EventHandler.prototype.registerMetaListener = function(l) {
    this.lmeta.push(l);
}

EventHandler.prototype.notifyMetaChanged = function(p) {
    this.lmeta.forEach(function(l){l(p);});
}


function EmbeddingProjector(container) {
    if (typeof container === typeof "") {
        container = document.querySelector(container);
    }
    if ( !isElement(container) ) console.error("Not dom: ", container);

    var svgDom = document.createElement("svg");
    svgDom.id = "selector"
    svgDom.style.position = "absolute";
    svgDom.style.display = "none";
    svgDom.style.height = "100%";
    svgDom.style.width = "100%";
    container.appendChild( svgDom );
    container.style.position = "relative";

    this.eventHandler = new EventHandler();
    this.container = container;
    this.adp = new wc.ProjectorScatterPlotAdapter(this.container, this.eventHandler);
    this.adp.setLabelPointAccessor("label");
}

EmbeddingProjector.prototype.on = function(event, l) {
    if (event == "hover") this.eventHandler.registerHoverListener(l);
    else if (event == "selection") this.eventHandler.registerSelectionChangedListener(l);
    else if (event == "projection") this.eventHandler.registerProjectionChangedListener(l);
    else if (event == "metric") this.eventHandler.registerDistanceMetricChangedListener(l);
    else if (event == "meta") this.eventHandler.registerMetaListener(l);
    else console.error("Unknown event " + event);
}

/*
data = [
    { metadata: {"label": "x"}, vector: new Float32Array([0, 1, 1])},
    { metadata: {"label": "y"}, vector: new Float32Array([1, 0, 0])},
    { metadata: {"label": "z"}, vector: new Float32Array([1, 1, 0])},
];
*/
EmbeddingProjector.prototype.loadData = function(rawData) {
    var data = [];
    for (var i = 0; i < rawData.length; ++ i) {
        var obj = rawData[i];
        obj.index = i;
        obj.projections = {};
        data.push(obj);
    }
    this.eventHandler.dataset = new wc.DataSet(data);
    this.eventHandler.dataset.normalize();
    var that = this;
    return new Promise(function(resolve, reject) {
        var worker = new Worker("/js/worker.js");
        worker.onmessage = function(ev) {
            that.eventHandler.dataset.fracVariancesExplained = ev.data.fracVariancesExplained;
            for (var i = 0; i < ev.data.points.length; ++ i) {
                that.eventHandler.dataset.points[i].projections = ev.data.points[i].projections;
            }
            that.eventHandler.dataset.projections = ev.data.projections;
            worker.terminate();

            var proj = new wc.Projection('pca', ['pca-0', 'pca-1', 'pca-2'], 3, that.eventHandler.dataset);
            that.eventHandler.notifyProjectionChanged(proj);
            resolve();
        };
        worker.onerror = function(err) {
            reject(err);
        };
        worker.onmessageerror = function(err) {
            reject(err);
        };

        worker.postMessage({
            points: that.eventHandler.dataset.points,
            shuffledDataIndices: that.eventHandler.dataset.shuffledDataIndices
        });
    });
}

EmbeddingProjector.prototype.resize = function() {
    this.adp.resize();
}

EmbeddingProjector.prototype.render = function() {
    this.adp.render();
}

EmbeddingProjector.prototype.setMetric = function(algo) {
    if (typeof algo === typeof "") {
        if (algo == "cosine") algo = wc.vector.cosDist;
        else if (algo == "euclidean") algo = wc.vector.dist;
    }
    this.eventHandler.notifyDistanceMetricChanged(algo);
}

EmbeddingProjector.prototype.getMetric = function() {
    return this.eventHandler.distFunc;
}

EmbeddingProjector.prototype.setNumNeighbors = function(num) {
    this.eventHandler.numNN = num;
}

EmbeddingProjector.prototype.getNumNeighbors = function() {
    return this.eventHandler.numNN;
}

window.EmbeddingProjector = EmbeddingProjector;
})();