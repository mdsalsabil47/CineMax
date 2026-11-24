# CINEMAX — Movie Explorer

A responsive movie explorer built with HTML, CSS and JavaScript. It uses a free public movie API and does not require an API key.

## Run locally
1. Extract the project ZIP.
2. Open the folder in VS Code.
3. Run `index.html` with Live Server (recommended), or open it in a browser.
4. Search for a movie.

## API
- Provider: Testing APIs
- Endpoint: `https://api.testingapis.com/api/Movies`
- No API key or account is required.
- API documentation: https://testingapis.com/docs/movies/get-all/

This is a demo/testing API with a small sample movie dataset. Poster images are placeholders rather than official movie posters. The service is intended for learning, testing and prototypes, so availability and data may change.

## Features
- Movie search using `fetch()` and `async/await`
- Dynamic movie cards created with DOM manipulation
- Movie details modal
- Year and genre filters
- Watchlist saved in `localStorage`
- Loading, error and empty states
- Responsive dark interface

## Assignment requirements
- **DOM manipulation and dynamic rendering:** movie cards and detail modal are generated dynamically.
- **Event handling and JavaScript logic:** `addEventListener`, arrays, objects, `map`, `filter`, `forEach`, `find`.
- **API integration and asynchronous operations:** public API requests use `fetch()` and `async/await`, with loading/error/empty states.
- **Local Storage:** watchlist is saved and restored using `localStorage`.

## Note
This is a frontend classroom project. The public API provides sample/demo data and should not be treated as a production movie database.
