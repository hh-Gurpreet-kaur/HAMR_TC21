

let Sort = {
    compareSkuAsc: function(a, b) {
        return a.key.localeCompare(b.key);
    },

    compareSkuDesc: function(a, b) {
        return b.key.localeCompare(a.key);
    },

    compareBohAsc: function(a, b) {
        return a.boh - b.boh;
    },

    compareBohDesc: function(a, b) {
        return b.boh - a.boh;
    },

    compareDescriptionAsc: function(a, b) {
        return a.descr.localeCompare(b.descr);
    },

    compareDescriptionDesc: function(a, b) {
        return b.descr.localeCompare(a.descr);
    },
}

export default Sort;