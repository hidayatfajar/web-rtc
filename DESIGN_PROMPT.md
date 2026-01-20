# WebRTC Video Conference - Design System Prompt

## Project Overview
Modern real-time video conferencing application with WebRTC and WebSocket technology. Clean, minimalist design inspired by Google Meet/Zoom with emphasis on usability and modern aesthetics.

---

## 🎨 Design Specifications

### Color Palette
**Primary Colors:**
- Primary Blue: `#1a73e8` (buttons, accents)
- Primary Dark: `#174ea6` (hover states)
- Success Green: `#34a853` (active states)
- Danger Red: `#ea4335` (recording, delete)
- Warning Yellow: `#fbbc04` (notifications)

**Neutral Colors:**
- Background: `#ffffff` (main)
- Surface: `#f8f9fa` (cards, panels)
- Border: `#e8eaed` (dividers)
- Text Primary: `#202124`
- Text Secondary: `#5f6368`
- Dark Overlay: `rgba(0, 0, 0, 0.7)`

**Status Indicators:**
- Camera On: `#34a853`
- Mic On: `#1a73e8`
- Camera Off: `#ea4335`
- Mic Off: `#f9ab00`

### Typography
- **Font Family:** Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Heading 1:** 32px, Bold (700)
- **Heading 2:** 24px, Semi-Bold (600)
- **Heading 3:** 18px, Semi-Bold (600)
- **Body:** 14px, Regular (400)
- **Small:** 12px, Regular (400)
- **Button Text:** 14px, Medium (500)

### Spacing System
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Border Radius
- Small: 8px
- Medium: 12px
- Large: 16px
- Circle: 50%

---

## 📱 Layout 1: Landing Page (Pre-Meeting)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                         [LOGO/ICON]                           │
│                                                               │
│                    WebRTC Meeting Room                        │
│                  Connect instantly, securely                  │
│                                                               │
│         ┌───────────────────────────────────────┐            │
│         │  👤  Enter your name                  │            │
│         └───────────────────────────────────────┘            │
│                                                               │
│         ┌───────────────────────────────────────┐            │
│         │  🚪  Room ID (e.g., room-1)           │            │
│         └───────────────────────────────────────┘            │
│                                                               │
│         ┌───────────────────────────────────────┐            │
│         │        Join Meeting  →                 │            │
│         └───────────────────────────────────────┘            │
│                                                               │
│                 💡 Features: Screen Share,                    │
│              Recording, Real-time Video & Audio               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Design Details
**Container:**
- Max width: 480px
- Center aligned
- Padding: 48px 24px
- Background: white with subtle shadow
- Border radius: 16px

**Input Fields:**
- Height: 48px
- Border: 1px solid #e8eaed
- Focus: 2px solid #1a73e8
- Icon left aligned (20px from left)
- Placeholder: #5f6368
- Text: #202124

**Join Button:**
- Full width
- Height: 48px
- Background: Linear gradient (#1a73e8 to #1557b0)
- Text: White, 14px, Medium
- Border radius: 8px
- Hover: scale(1.02), shadow elevation
- Active: scale(0.98)

**Feature List:**
- Text: 12px, #5f6368
- Icons: 16px, subtle color
- Center aligned

---

## 📱 Layout 2: Meeting Room (Main Interface)

### Overall Layout Structure
```
┌──────────────────────────────────────────────────────────────────────┐
│  Header Bar                                                           │
│  Room: room-1  |  🟢 3 Participants  |  ⏱️ 00:15:42     [⚙️] [❌]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────┬─────────────────────┐   │
│  │                                         │  Participants       │   │
│  │      Video Grid / Screen Share         │  ┌───────────────┐  │   │
│  │      (Main Content Area)               │  │ 👤 You        │  │   │
│  │                                         │  │ 📹 🎤         │  │   │
│  │   [4x grid of participant videos       │  └───────────────┘  │   │
│  │    or large screen share preview]      │  ┌───────────────┐  │   │
│  │                                         │  │ 👤 User-abc   │  │   │
│  │                                         │  │ 🚫 🔇         │  │   │
│  │                                         │  └───────────────┘  │   │
│  │                                         │                     │   │
│  │                                         │  ┌───────────────┐  │   │
│  └────────────────────────────────────────┤  │  Chat (Soon)  │  │   │
│  │    Bottom Control Bar                  │  │               │  │   │
│  │  [🎤] [📹] [🖥️] [⏺️] [💬] [👥]  [📞] │  └───────────────┘  │   │
│  └────────────────────────────────────────┴─────────────────────┘   │
│                                                                        │
│  Debug Console (Collapsible)                                          │
│  ▼ Debug Log (20 entries)                                             │
│  [23:15:42] User connected: abc123                                    │
│  [23:15:45] Camera enabled                                            │
│  [23:15:47] Offer sent to user-xyz                                    │
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Header Bar
**Height:** 64px
**Background:** White with bottom border (#e8eaed)
**Content:**
- Room name badge (pill shape, #f8f9fa background)
- Active indicator (green dot + participant count)
- Duration timer (monospace font)
- Settings icon button (right)
- Leave/End call button (red, right)

**Styling:**
```
Display: flex, justify-between
Padding: 0 24px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

#### 2. Main Content Area (Left Side - 75% width)

**Video Grid:**
- Responsive grid: 2x2, 3x3, or 4x4 based on participant count
- Each video tile:
  - Aspect ratio: 16:9
  - Border radius: 12px
  - Border: 2px solid (active speaker: #1a73e8, others: transparent)
  - Background: #000 (when no video)
  - Overflow: hidden

**Video Tile Overlay:**
- Bottom left: Name badge
  - Background: rgba(0,0,0,0.7)
  - Text: White, 12px
  - Padding: 4px 12px
  - Border radius: 4px
  - Status icons: 📹/🚫 🎤/🔇

**Placeholder (Camera Off):**
- Center aligned
- Icon: 👤 (64px)
- Background: Linear gradient (#202124 to #3c4043)
- Text: "Camera is off" (14px, #9aa0a6)

**Screen Share Mode:**
- Single large view (fills area)
- Small participant videos (bottom right, 4 thumbnails max)
- Each thumbnail: 160x90px with same styling

#### 3. Right Sidebar (25% width)

**Participants Panel:**
- Background: #f8f9fa
- Border left: 1px solid #e8eaed
- Padding: 16px

**Participant List Item:**
- Height: 56px
- Background: White
- Border radius: 8px
- Margin bottom: 8px
- Padding: 12px
- Display: flex, align-items: center

**List Item Structure:**
```
┌────────────────────────┐
│ 👤  John Doe           │
│     📹 🎤         (You) │
└────────────────────────┘
```

**Elements:**
- Avatar circle: 32px, background gradient
- Name: 14px, Medium, #202124
- Status icons: 16px, with color indicators
- "You" badge: 10px, #1a73e8, rounded

**Chat Panel (Future):**
- Background: White
- Border top: 1px solid #e8eaed
- Input box at bottom
- Message bubbles: Rounded, alternating alignment

#### 4. Bottom Control Bar

**Height:** 80px
**Background:** White
**Border top:** 1px solid #e8eaed
**Shadow:** 0 -2px 8px rgba(0,0,0,0.1)

**Button Layout (Center Group):**
```
[Microphone] [Camera] [Screen Share] [Record] [Chat] [Participants]
```

**Button Specifications:**
- Size: 48x48px circular
- Icon: 20px
- Background states:
  - Active/On: #1a73e8 or #34a853
  - Inactive/Off: #f8f9fa
  - Hover: Slightly darker shade
  - Recording: #ea4335 with pulse animation

**Button Styles:**
```css
.control-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.control-button.active {
  background: #1a73e8;
  color: white;
}

.control-button.recording {
  background: #ea4335;
  animation: pulse 1.5s infinite;
}
```

**End Call Button (Right):**
- Background: #ea4335
- Width: 120px
- Height: 48px
- Border radius: 24px
- Text: "End Call"
- Icon: 📞

#### 5. Debug Console (Bottom, Collapsible)

**Collapsed State:**
- Height: 40px
- Background: #f8f9fa
- Border top: 1px solid #e8eaed
- Click to expand

**Expanded State:**
- Max height: 200px
- Overflow-y: scroll
- Background: #1e1e1e (dark theme)
- Text: Monospace, 11px, #50fa7b (green)

**Log Entry Format:**
```
[timestamp] Event description
```

**Styling:**
```css
.debug-console {
  font-family: 'Fira Code', 'Consolas', monospace;
  padding: 12px 16px;
  background: #1e1e1e;
  color: #50fa7b;
}

.log-entry {
  padding: 2px 0;
  border-left: 2px solid transparent;
}

.log-entry:hover {
  border-left-color: #1a73e8;
  background: rgba(255,255,255,0.05);
}
```

---

## 🎭 Interactive States & Animations

### Hover States
**Buttons:** Scale(1.05), shadow elevation
**Video tiles:** Border glow effect
**Participant list:** Background lightens

### Active/Focus States
**Video tile (speaking):** Animated border pulse (#1a73e8)
**Input fields:** 2px solid border
**Buttons:** Darker background

### Loading States
**Joining room:** Skeleton screens
**Video loading:** Shimmer effect
**Recording:** Pulse animation on button

### Transitions
- All: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- Modal: `transition: opacity 0.3s, transform 0.3s`
- Sidebar: `transition: width 0.3s ease`

### Animations
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📐 Responsive Breakpoints

### Desktop (>1200px)
- Full layout as described
- Sidebar: 25% width (300px)
- Video grid: 4x4 or 3x3

### Tablet (768px - 1200px)
- Sidebar: Overlay on top of video
- Video grid: 2x2 or 3x2
- Control bar: Icons only (no text)

### Mobile (<768px)
- Single column layout
- Sidebar: Bottom sheet modal
- Video grid: 1x1 (swipeable)
- Control bar: 4 main buttons only
- Debug console: Hidden by default

---

## 🎯 Component Priority States

### Video Tile Priority
1. **Active Speaker:** Larger tile, blue border
2. **Screen Share:** Full width, thumbnails for others
3. **You:** Always visible, bordered

### Button States
```
Priority Order (Left to Right):
1. Microphone (critical)
2. Camera (critical)
3. Screen Share (important)
4. Record (optional)
5. Chat (optional)
6. Participants (info)
```

---

## 🔔 Notification Patterns

### Toast Notifications
- Position: Top-right
- Width: 320px
- Background: White
- Shadow: 0 4px 16px rgba(0,0,0,0.15)
- Duration: 3s
- Animation: Slide in from right

**Types:**
- **Success:** Green icon, "✓ User joined"
- **Error:** Red icon, "✗ Connection failed"
- **Info:** Blue icon, "ℹ Recording started"

---

## 💡 Accessibility Requirements

- **Keyboard Navigation:** All controls accessible via Tab
- **Screen Reader:** ARIA labels on all buttons
- **High Contrast:** Support for high contrast mode
- **Focus Indicators:** 2px solid outline
- **Text Alternatives:** Alt text for all icons
- **Font Scaling:** Support up to 200% zoom

---

## 🎨 Icon Set Requirements

Use Google Material Icons or similar:
- Microphone: `mic` / `mic_off`
- Camera: `videocam` / `videocam_off`
- Screen Share: `screen_share` / `stop_screen_share`
- Record: `fiber_manual_record` / `stop`
- Chat: `chat` / `chat_bubble`
- Participants: `people` / `group`
- Settings: `settings`
- End Call: `call_end`
- Info: `info`
- Close: `close`

---

## 📝 Micro-interactions

1. **Join Meeting:** Button expands, success checkmark appears
2. **Camera Toggle:** Icon rotates 360°
3. **Mute/Unmute:** Icon scales with bounce
4. **Screen Share Start:** Ripple effect from button
5. **Recording Start:** Red dot pulses
6. **New Participant:** Video tile fades in with scale
7. **User Leaves:** Video tile fades out
8. **Active Speaker:** Border animates clockwise

---

## 🎬 Example User Flows

### Flow 1: Join Meeting
1. User enters name + room ID
2. Button shows loading spinner
3. Success → Fade to meeting room
4. Video tiles populate with fade-in animation
5. Your video appears with blue border highlight

### Flow 2: Share Screen
1. User clicks screen share button
2. Browser picker appears
3. On selection → Layout transitions to large screen view
4. Participant thumbnails slide to bottom-right
5. Stop button replaces screen share button

### Flow 3: Toggle Camera
1. User clicks camera button
2. Icon rotates
3. Video smoothly fades out/placeholder fades in
4. Status indicator updates for all participants
5. Remote participants see placeholder immediately

---

## 🖼️ Design Assets Needed

1. **Logo/Icon** (SVG)
   - Size: 48x48px
   - Simple, modern, recognizable
   - Monochrome and colored versions

2. **Empty States**
   - No participants yet
   - Camera off placeholder
   - No screen sharing

3. **Loading States**
   - Skeleton screens
   - Spinners (24px, 32px)
   - Progress bars

4. **Illustrations**
   - Welcome screen illustration
   - Connection error state
   - Room full state

---

## 📦 Design Deliverables

1. **Figma/Sketch Files:**
   - Landing page (Desktop + Mobile)
   - Meeting room (Desktop + Tablet + Mobile)
   - Component library
   - Color styles
   - Text styles
   - Icon set

2. **Prototype:**
   - Interactive prototype showing main flows
   - Micro-interactions demonstrated
   - Responsive behavior

3. **Design System Documentation:**
   - Component usage guidelines
   - Spacing system
   - Color usage rules
   - Typography scale

4. **Export Assets:**
   - SVG icons (all states)
   - PNG assets (1x, 2x, 3x)
   - Design tokens (JSON)

---

## 🚀 Implementation Notes

### CSS Framework Suggestion
Use Tailwind CSS with custom configuration:
- Custom color palette
- Extended spacing scale
- Custom animations
- Component classes

### Component Architecture
```
components/
├── landing/
│   ├── JoinForm.vue
│   └── FeatureList.vue
├── meeting/
│   ├── Header.vue
│   ├── VideoGrid.vue
│   ├── VideoTile.vue
│   ├── ControlBar.vue
│   ├── Sidebar.vue
│   ├── ParticipantList.vue
│   ├── DebugConsole.vue
│   └── Toast.vue
└── common/
    ├── Button.vue
    ├── Input.vue
    └── Icon.vue
```

### Performance Considerations
- Lazy load video tiles
- Virtualize participant list (if >50 users)
- Optimize re-renders with proper state management
- Use CSS transforms for animations (GPU acceleration)
- Debounce resize events

---

## 🎯 Success Metrics

1. **Visual Consistency:** 95% adherence to design system
2. **Performance:** 60fps animations, <100ms interaction response
3. **Accessibility:** WCAG 2.1 AA compliance
4. **Usability:** <3 clicks to perform any action
5. **Responsiveness:** Works on all devices 320px+

---

**Design Version:** 1.0
**Last Updated:** January 19, 2026
**Design System:** Material Design 3 inspired
**Target Platforms:** Web (Desktop, Tablet, Mobile)
