'use strict';

Vue.prototype.$maxsize = 12;
Vue.prototype.$mineDensityPercent = 12;

let minesVueeper = new Vue({
    el: '#main',
    data: function() {
        let tileRow;
        let grid = [];
        Array.from(Array(this.gridHeight()).keys()).forEach(
            (m) => {
                tileRow = [];
                Array.from(Array(this.gridWidth()).keys()).forEach(
                    (n) => {
                        tileRow.push({
                            // Is there a mine in this cell?
                            mine: false,
                            // Number of mines in neighborhood
                            mines: 0,
                            // Tile number (vertical)
                            x: m,
                            // Tile numnber (horizontal)
                            y: n,
                            // Has this tile been clicked?
                            clicked: false,
                            // Is this tile flagged?
                            flagged: false,
                            disabled: false,
                            // Display tile (whether clicked or not)
                            show: false });
                    }
                );
                grid.push(tileRow);
            }
        );
        return { grid: grid,
                 smiley: '&#9786',
                 seconds: 0,
                 unflaggedmines: 0,
                 MINE_SYMBOL: '&#10041;', // Twelve pointed black star
                 FLAG_SYMBOL: '&#9873;', // Black flag
                 SMILEY_SHADES: '&#128526;',
                 SMILEY_SMILE: '&#9786;',
                 SMILEY_FROWN: '&#9785;'

               }
    },
    // https://vuejs.org/v2/api/#created
    created() {
        this.setMines();
        this.countMines();
        this.countunflaggedmines();
    },
    // https://vuejs.org/v2/api/#methods
    methods: {
        gridWidth: function() {
            return Math.min(Math.floor(window.innerWidth / 42), this.$maxsize);
        },
        gridHeight: function() {
            return Math.min(Math.floor(window.innerWidth / 42), this.$maxsize);
        },

        startClock: function() {
            if (typeof(this.timer) == 'undefined') {
                this.timer = setInterval(() => { this.seconds++; }, 1000);
            }
        },
        click: function(s){
            this.startClock();
            if (s.flagged) {
                return;
            }
            s.clicked = true;
            if (this.chkmine(s)) {
                this.gameOver();
                return;
            }
            this.expandClick(s);
            this.checkComplete();
        },
        countunflaggedmines: function() {
            let count = 0;
            this.grid.forEach(
                (x) => {
                    x.forEach(
                        (y) => {
                            if (y.mine && !y.flagged) {
                                count++;
                            }
                        }
                    )
                }
            );
            this.unflaggedmines = count;
        },
        rightClick: function(s){
            this.startClock();
            s.flagged = !s.flagged;
            this.setTileLabel(s);
            this.countunflaggedmines();
        },
        expandClick: function(e) {
            if (e.mine) {
                return;
            }
            if (!e.clicked && !e.flagged) {
                e.clicked = true;
                e.disabled = true;
            }
            if (e.mines > 0) {
                return;
            }
            [-1, 0, 1].forEach(
                (m) => {
                    [-1, 0, 1].forEach(
                        (n) => {
                            if ((m !== 0 || n !== 0) && e.x+m >= 0 && e.x+m < this.gridHeight() && e.y+n >= 0 && e.y+n < this.gridWidth()) {
                                if (!this.grid[e.x+m][e.y+n].clicked) {
                                    this.expandClick(this.grid[e.x+m][e.y+n]);
                                }
                            }
                        }
                    );
                }
            );
        },
        mineDensity: function() {
            let minesTotal = 0;
            this.grid.forEach(
                (x) => {
                    x.forEach(
                        (y) => {
                            if (y.mine) {
                                minesTotal++;
                            }
                        }
                    );
                }
            );
            return 100 * minesTotal / (this.grid.length * this.grid[0].length);
        },
        plantMine: function(tile) {
            tile.mine = true;
            tile.label = this.MINE_SYMBOL;
        },
        setMines: function() {
            let gridSize = this.grid.length * this.grid[0].length;
            while (this.mineDensity() < this.$mineDensityPercent) {
                let randomx = Math.floor(Math.random() * this.grid.length);
                let randomy = Math.floor(Math.random() * this.grid[0].length);
                this.plantMine(this.grid[randomx][randomy]);
            }
        },
        isMine: function(x, y) {
            if (x < 0 || y < 0 || x >= this.gridHeight() || y >= this.gridWidth()) {
                return false;
            }
            return this.grid[x][y].mine;
        },
        countMineNeighbors: function(tile) {
            let mineNeighbors = 0;
            [-1, 0, 1].forEach(
                (m) => {
                    [-1, 0, 1].forEach(
                        (n) => {
                            if ((m !== 0 || n !== 0) && this.isMine(tile.x + m, tile.y + n)) {
                                mineNeighbors++;
                            }
                        }
                    );
                }
            );
            tile.mines = mineNeighbors;
            tile.label = mineNeighbors;
            return tile;
        },
        countMines: function() {
            Array.from(Array(this.gridHeight()).keys()).forEach(
                (m) => {
                    Array.from(Array(this.gridWidth()).keys()).forEach(
                        (n) => {
                            if (!this.grid[m][n].mine) {
                                this.grid[m][n] = this.countMineNeighbors(this.grid[m][n]);
                            }
                        }
                    );
                }
            );
        },
        gameOver: function() {
            window.clearInterval(this.timer);
            this.revealMines();
            this.smiley = this.SMILEY_FROWN;
        },
        setTileLabel: function(tile) {
            if (tile.flagged) {
                tile.label = this.FLAG_SYMBOL;
                return;
            }
            if (tile.mine) {
                tile.label = this.MINE_SYMBOL;
                return;
            }
            tile.label = tile.mines;
        },
        incompleteTile: function(tile) {
            return (!this.isMine(tile.x, tile.y) && !tile.clicked);
        },
        incompleteRow: function(row) {
            if (row.some(this.incompleteTile)) {
                return true;
            }
            return false;
        },
        checkComplete: function() {
            if (!this.grid.some(this.incompleteRow)) {
                window.clearInterval(this.timer);
                this.smiley = this.SMILEY_SHADES;
            }
        },
        chkmine: function(tile) {
            return tile.mine;
        },
        revealMines: function() {
            this.grid.forEach(
                (row) => {
                    row.forEach(
                        (tile) => {
                            tile.show = true;
                            tile.disabled = true;
                        }
                    );
                }       
            );
        }
    }
});
