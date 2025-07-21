# 📊 QuickPoll

A lightweight poll creation tool for the web. Create a poll, share a unique link, and let others vote. No login or account required.

## Features

- Create polls with any number of options
- Shareable poll link (unique ID)
- Users can vote once (by IP address)
- Results shown after voting
- Clean, mobile-friendly interface

## How It Works

1. User enters a title and options for the poll.
2. A unique link is generated and shared.
3. Anyone with the link can vote once.
4. After voting, the results are shown.

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Data Storage: JSON files on the server

## Folder Structure

quickpoll/
├── index.html # Main interface
├── style.css # UI styling
├── script.js # Frontend logic
├── php/
│ ├── create_poll.php # Handles poll creation
│ ├── get_poll.php # Fetches poll data
│ ├── vote.php # Records a vote (IP-based)
│ └── get_results.php # Returns poll results
└── polls/ # Stores poll JSON files

pgsql
Copy
Edit

## Installation

1. Place the project files on a web server with PHP support.
2. Make sure the `polls/` directory is writable by the server (`chmod 777` for testing).
3. Open `index.html` in your browser to start using it.

## Limitations

- No user authentication (anyone with the link can vote)
- IP-based vote restriction (not 100% secure)
- Polls are not editable after creation

## Future Improvements

- Password-protected polls
- Expiration dates for polls
- Live results update without page reload
- Cookie-based vote tracking instead of IP
