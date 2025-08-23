# ⚽ Soccer Lineup Manager

A professional web-based application for managing youth soccer team lineups with intelligent rotation, fair playing time distribution, and mobile-first design.

## 🌟 Features

### Core Functionality
- **Visual Lineup Management**: Drag-and-drop interface with realistic soccer field
- **Smart Player Rotation**: Automated fair playing time distribution
- **Multi-Period Support**: Manage 8 periods with 7.5-minute intervals
- **Position Validation**: Ensures players are assigned to compatible positions
- **Goalkeeper Rotation**: Special handling for goalkeeper assignments and jersey preparation

### Phase 1 Enhancements
- 🎯 **Toast Notifications**: Beautiful, non-blocking user feedback
- 📱 **Mobile-First Design**: Touch gestures, haptic feedback, swipe navigation
- ↩️ **Undo/Redo**: Complete action history with keyboard shortcuts
- 📊 **Advanced Statistics**: Real-time balance analysis and fairness scoring
- 🎨 **Visual Indicators**: Color-coded status indicators and progress bars

## 🚀 Quick Start

### Option 1: Direct Usage
1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Start managing your lineup immediately!

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/soccer-lineup-manager.git
cd soccer-lineup-manager

# Start a local server (optional, for development)
python3 -m http.server 8080
# or
npx serve .

# Open in browser
open http://localhost:8080
```

## 📱 Mobile Usage

The application is optimized for tablets and mobile devices:

- **Long press + drag**: Move players between positions
- **Swipe left/right**: Navigate between periods  
- **Tap player cards**: View quick statistics
- **Pull to refresh**: Update lineup display
- **Haptic feedback**: Tactile responses on supported devices

## 🎮 Keyboard Shortcuts

- `Ctrl+Z` / `Cmd+Z`: Undo last action
- `Ctrl+Y` / `Cmd+Y`: Redo action
- `←` / `→`: Navigate periods (when focused on period nav)

## 📊 Player Configuration

Edit `js/config.js` to customize your team roster:

```javascript
players: {
    'PlayerName': ['Position1', 'Position2', 'All'],
    'Kennedy': ['Striker', 'Wing', 'Midfield'],
    'Aubree': ['All'],
    'SK': ['Back', 'Goalkeeper'],
    // Add your players here...
}
```

### Position Options:
- `'All'`: Can play any position including goalkeeper
- `'All except GK'`: Can play any field position
- `'Striker'`, `'Wing'`, `'Midfield'`, `'Back'`, `'Defense'`, `'Goalkeeper'`: Specific positions

## 🏗️ Architecture

The application uses a modular architecture for maintainability:

```
js/
├── config.js              # Team configuration and settings
├── toastManager.js         # User notification system
├── lineupManager.js        # Core lineup logic
├── historyManager.js       # Undo/redo functionality
├── enhancedStats.js        # Advanced analytics
├── uiManager.js            # UI updates and rendering
├── dragDrop.js             # Drag and drop interactions
├── mobileEnhancements.js   # Mobile optimizations
├── autoFill.js             # Intelligent lineup generation
├── exportUtils.js          # Export and import features
└── app.js                  # Application initialization
```

## 📈 Statistics & Analytics

The enhanced statistics system provides:

- **Fairness Score**: 0-100% rating of playing time balance
- **Visual Indicators**: Color-coded status for each player
- **Balance Analysis**: Identifies overused/underused players
- **Position Analytics**: Usage patterns across all positions
- **Real-time Warnings**: Automatic alerts for lineup issues

## 📤 Export Options

- **Screenshot**: High-resolution PNG of complete lineup table
- **CSV Export**: Spreadsheet-compatible data export
- **JSON Export**: Complete lineup data for backup/sharing
- **Print**: Printer-friendly lineup summary
- **Clipboard**: Quick copy of lineup text summary

## 🧪 Testing

Run the test suite to verify functionality:

1. Open `test_phase1.html` in your browser
2. Click test buttons to verify each feature
3. Check console for detailed test results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow existing code style and structure
- Add comprehensive comments for new features
- Test on both desktop and mobile devices
- Update documentation for user-facing changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for youth soccer coaches who need fair, efficient lineup management
- Inspired by the need for better digital tools in youth sports
- Designed with input from real coaches and team managers

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Feature Requests**: Submit enhancement ideas via GitHub Discussions
- **Documentation**: See `PHASE1_IMPROVEMENTS.md` for detailed feature documentation

## 🔮 Roadmap

### Phase 2 (Planned)
- Multi-formation support (4-4-2, 4-3-3, custom formations)
- Advanced export options (PDF reports, email integration)
- Smart suggestion system with AI recommendations
- Enhanced error handling and recovery

### Phase 3 (Future)
- Multi-game season management
- Team communication tools
- League integration capabilities
- Advanced analytics dashboard

---

**Made with ⚽ for youth soccer coaches everywhere**