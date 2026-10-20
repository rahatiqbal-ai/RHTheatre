
# Story-to-Video Prompt Builder

A specialized tool designed to create consistent AI video prompts by bridging character references, environmental context, and artistic direction.

## Core Features

- **Gated Workflow**: Follows a strict Step A (Characters) -> Step B (Art Style) -> Step C (Story Segments) flow.
- **Deterministic Locking**: Once a character or visual cue is confirmed, it is locked into the state to ensure prompt consistency.
- **Whole-Word Matching**: Character names are detected in script parts using regex-based boundary matching (e.g., "Ann" does not match "Annette").
- **Gemini Integration**: Uses `gemini-3-flash-preview` to generate "original" and "vivid" scene illustrations while strictly adhering to user-provided environment data.
- **Prompt Persistence**: All data is saved to `localStorage`, allowing you to resume work after a refresh.
- **Export Capabilities**: Download your entire storyboard as a single `.txt` prompt collection or raw `.json` data.

## Matching Rules
- Matching is case-insensitive.
- Multi-word names (e.g., "Dr. Smith") are matched with flexible whitespace.
- Detection order follows appearance in the script.

## Setup Instructions
1. Ensure your API Key is available in the environment (as per the developer instructions).
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Run `npm test` to execute the unit test suite.

## Development Notes
- **Images**: Reference images are stored as Data URLs in LocalStorage. Large images are resized and compressed to JPEG for efficient storage.
- **Styling**: Built with Tailwind CSS for a modern, responsive UI.
- **Prompt Structure**: Generates clean, cohesive video prompts without structural labels, using character references and art styles consistently.
- **Characters**: Requires at least 1 and up to 5 locked characters to proceed to Step B.
