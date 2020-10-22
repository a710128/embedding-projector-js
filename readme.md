# Embedding Projector js

## EmbeddingProjector(container)

**container**:  DOM or querySelector

## EmbeddingProjector.on(event, listener)

**event**: `hover`, `selection`, `projection`, `metric`, `meta`.

**listener**: a function that takes one or two (`selection`) parameters.

## EmbeddingProjector.loadData(data) => Promise

Now only PCA is supported.

**data**: a list of objects
```javascript
[
    { metadata: {"label": "x"}, vector: new Float32Array([0, 1, 1])},
    { metadata: {"label": "y"}, vector: new Float32Array([1, 0, 0])},
    { metadata: {"label": "z"}, vector: new Float32Array([1, 1, 0])},
]
```

## EmbeddingProjector.resize()

## EmbeddingProjector.render()

## EmbeddingProjector.setMetric(algorithm)

**algorithm**: `cosine` , `euclidean` or your custom metric function