// Export Utilities Module
// Handles lineup export functionality including screenshots and data export

const ExportUtils = {
    // Export lineup as screenshot
    async exportLineupScreenshot() {
        try {
            // Switch to table view if not already there
            const wasTableView = UIManager.isTableView;
            if (!wasTableView) {
                UIManager.toggleView();
            }
            
            // Wait for table to render
            await this.waitForRender(300);
            
            // Capture screenshot
            const success = await this.captureTableScreenshot();
            
            // Switch back to original view if needed
            if (!wasTableView) {
                setTimeout(() => UIManager.toggleView(), 100);
            }
            
            return success;
        } catch (error) {
            console.error('Export failed:', error);
            this.showExportError('Screenshot export failed. Please try again.');
            return false;
        }
    },

    // Capture table as screenshot using html2canvas
    async captureTableScreenshot() {
        const tableElement = document.getElementById('lineupTable');
        if (!tableElement) {
            throw new Error('Lineup table not found');
        }

        try {
            const canvas = await html2canvas(tableElement, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: tableElement.scrollWidth,
                height: tableElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // Ensure styles are applied in cloned document
                    const clonedTable = clonedDoc.getElementById('lineupTable');
                    if (clonedTable) {
                        clonedTable.style.fontSize = '14px';
                        clonedTable.style.fontFamily = 'Arial, sans-serif';
                    }
                }
            });

            await this.downloadCanvas(canvas, 'lineup-screenshot');
            this.showExportSuccess('Screenshot saved successfully!');
            return true;
        } catch (error) {
            console.error('Canvas capture failed:', error);
            throw error;
        }
    },

    // Download canvas as PNG file
    async downloadCanvas(canvas, baseName) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                const timestamp = new Date().toISOString().split('T')[0];
                link.download = `${baseName}-${timestamp}.png`;
                link.href = url;
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                URL.revokeObjectURL(url);
                resolve();
            }, 'image/png');
        });
    },

    // Export lineup data as JSON
    exportLineupData() {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    gameSettings: SoccerConfig.gameSettings,
                    players: SoccerConfig.players
                },
                lineup: LineupManager.getFullLineup(),
                statistics: this.generateStatistics()
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            this.downloadTextFile(jsonString, 'lineup-data', 'json');
            this.showExportSuccess('Lineup data exported successfully!');
            return true;
        } catch (error) {
            console.error('Data export failed:', error);
            this.showExportError('Data export failed. Please try again.');
            return false;
        }
    },

    // Export lineup as CSV for spreadsheet applications
    exportLineupCSV() {
        try {
            const csvContent = this.generateCSVContent();
            this.downloadTextFile(csvContent, 'lineup-summary', 'csv');
            this.showExportSuccess('Lineup CSV exported successfully!');
            return true;
        } catch (error) {
            console.error('CSV export failed:', error);
            this.showExportError('CSV export failed. Please try again.');
            return false;
        }
    },

    // Generate CSV content
    generateCSVContent() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const headers = [
            'Player',
            ...Array.from({length: SoccerConfig.gameSettings.totalPeriods}, (_, i) => `Period ${i + 1}`),
            'Total Minutes',
            'Bench Periods',
            'Position Summary'
        ];

        const rows = [headers.join(',')];

        playerNames.forEach(playerName => {
            const stats = LineupManager.calculatePlayerStats(playerName);
            const fullLineup = LineupManager.getFullLineup();
            
            const periodAssignments = [];
            for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
                const periodData = fullLineup[period];
                let assignment = '';
                
                // Check jersey preparation
                if (periodData.jersey && periodData.jersey.includes(playerName)) {
                    assignment = 'JERSEY';
                }
                // Check bench
                else if (periodData.bench.includes(playerName)) {
                    assignment = 'BENCH';
                } else {
                    // Check field positions
                    for (const [position, assignedPlayer] of Object.entries(periodData.positions)) {
                        if (assignedPlayer === playerName) {
                            assignment = SoccerConfig.utils.getPositionAbbrev(position);
                            break;
                        }
                    }
                }
                
                periodAssignments.push(assignment || '-');
            }

            const positionSummary = Object.entries(stats.positions)
                .filter(([pos, count]) => count > 0)
                .map(([pos, count]) => `${SoccerConfig.utils.getPositionAbbrev(pos)}:${count}`)
                .join(';') || 'None';

            const row = [
                `"${playerName}"`,
                ...periodAssignments.map(a => `"${a}"`),
                stats.totalMinutes,
                stats.benchPeriods + stats.jerseyPeriods,
                `"${positionSummary}"`
            ];

            rows.push(row.join(','));
        });

        return rows.join('\n');
    },

    // Generate statistics summary
    generateStatistics() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const statistics = {
            playerStats: {},
            periodSummary: {},
            overallMetrics: {}
        };

        // Player statistics
        playerNames.forEach(playerName => {
            statistics.playerStats[playerName] = LineupManager.calculatePlayerStats(playerName);
        });

        // Period summary
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = LineupManager.lineup[period];
            const playersOnField = Object.values(periodData.positions).filter(p => p !== null).length;
            
            statistics.periodSummary[period] = {
                playersOnField,
                playersOnBench: periodData.bench.length,
                playersOnJersey: periodData.jersey ? periodData.jersey.length : 0,
                positions: { ...periodData.positions }
            };
        }

        // Overall metrics
        const totalMinutes = playerNames.reduce((sum, player) => {
            return sum + statistics.playerStats[player].totalMinutes;
        }, 0);

        statistics.overallMetrics = {
            totalPlayerMinutes: totalMinutes,
            averagePlayingTime: totalMinutes / playerNames.length,
            totalBenchTime: playerNames.reduce((sum, player) => {
                return sum + statistics.playerStats[player].benchPeriods + statistics.playerStats[player].jerseyPeriods;
            }, 0)
        };

        return statistics;
    },

    // Download text file (JSON or CSV)
    downloadTextFile(content, baseName, extension) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `${baseName}-${timestamp}.${extension}`;
        link.href = url;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    // Import lineup data from JSON
    async importLineupData() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    resolve(false);
                    return;
                }

                try {
                    const text = await file.text();
                    const importData = JSON.parse(text);
                    
                    if (this.validateImportData(importData)) {
                        LineupManager.importState({
                            lineup: importData.lineup,
                            currentPeriod: importData.metadata?.currentPeriod || 1
                        });
                        
                        UIManager.updateDisplay();
                        this.showExportSuccess('Lineup data imported successfully!');
                        resolve(true);
                    } else {
                        this.showExportError('Invalid lineup data format.');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('Import failed:', error);
                    this.showExportError('Failed to import lineup data.');
                    resolve(false);
                }
            };
            
            input.click();
        });
    },

    // Validate imported data structure
    validateImportData(data) {
        if (!data.lineup || !data.metadata) return false;
        
        // Check if lineup has correct structure
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            if (!data.lineup[period] || 
                !data.lineup[period].positions ||
                !Array.isArray(data.lineup[period].bench)) {
                return false;
            }
        }
        
        return true;
    },

    // Utility methods
    waitForRender(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    showExportSuccess(message) {
        ToastManager.success(message, 4000);
        console.log('Export Success:', message);
    },

    showExportError(message) {
        ToastManager.error(message, 6000);
        console.error('Export Error:', message);
    },

    // Print functionality
    printLineup() {
        const wasTableView = UIManager.isTableView;
        if (!wasTableView) {
            UIManager.toggleView();
        }

        setTimeout(() => {
            window.print();
            
            if (!wasTableView) {
                setTimeout(() => UIManager.toggleView(), 1000);
            }
        }, 500);
    },

    // Generate shareable lineup text
    generateShareableText() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const fullLineup = LineupManager.getFullLineup();
        
        let text = '⚽ Soccer Lineup Summary\n';
        text += '='.repeat(30) + '\n\n';
        
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const timeInfo = SoccerConfig.utils.getPeriodTime(period);
            text += `Period ${period} (${timeInfo.display})\n`;
            text += '-'.repeat(25) + '\n';
            
            const periodData = fullLineup[period];
            
            // Field positions
            const fieldPlayers = Object.entries(periodData.positions)
                .filter(([pos, player]) => player)
                .map(([pos, player]) => `${SoccerConfig.utils.getPositionAbbrev(pos)}: ${player}`)
                .join(', ');
            
            text += `Field: ${fieldPlayers || 'None'}\n`;
            
            // Bench
            if (periodData.bench.length > 0) {
                text += `Bench: ${periodData.bench.join(', ')}\n`;
            }
            
            // Jersey
            if (periodData.jersey && periodData.jersey.length > 0) {
                text += `Jersey Prep: ${periodData.jersey.join(', ')}\n`;
            }
            
            text += '\n';
        }
        
        return text;
    },

    // Copy lineup to clipboard
    async copyLineupToClipboard() {
        try {
            const shareableText = this.generateShareableText();
            await navigator.clipboard.writeText(shareableText);
            this.showExportSuccess('Lineup copied to clipboard!');
            return true;
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            this.showExportError('Failed to copy lineup to clipboard.');
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportUtils;
}