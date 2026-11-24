const API_BASE = "https://api.testingapis.com/api/Movies";
const STORAGE_KEY = "cinemax_watchlist";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const movieGrid = document.getElementById("movieGrid");
const messageArea = document.getElementById("messageArea");
const sectionTitle = document.getElementById("sectionTitle");
const sectionEyebrow = document.getElementById("sectionEyebrow");
const yearFilter = document.getElementById("yearFilter");
const genreFilter = document.getElementById("genreFilter");
const watchlistCount = document.getElementById("watchlistCount");
const homeNav = document.getElementById("homeNav");
const watchlistNav = document.getElementById("watchlistNav");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let currentMovies = [];
let showingWatchlist = false;
let watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function updateWatchlistCount() {
  watchlistCount.textContent = watchlist.length;
}

function showMessage(title, description, type = "empty") {
  messageArea.className = `message-area ${type}`;
  messageArea.innerHTML = `<div class="empty-icon">${type === "error" ? "!" : "✦"}</div><h3>${title}</h3><p>${description}</p>`;
  messageArea.style.display = "block";
}

function showLoading() {
  messageArea.style.display = "none";
  movieGrid.innerHTML = Array.from({ length: 10 }, () => '<div class="skeleton"></div>').join("");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function isSaved(id) {
  return watchlist.some(movie => String(movie.id) === String(id));
}

function normalizeMovie(movie) {
  return {
    id: movie.id,
    Title: movie.title || "Untitled",
    Year: String(movie.year || "Year unknown"),
    Poster: movie.poster || "",
    Genres: Array.isArray(movie.genres) ? movie.genres : [],
    Runtime: movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : "Runtime N/A",
    Rating: movie.rating ?? "N/A",
    Director: movie.director || "N/A",
    Actors: Array.isArray(movie.cast) ? movie.cast.join(", ") : "N/A",
    Plot: movie.description || movie.body || "No plot summary available."
  };
}

function renderMovies(movies) {
  movieGrid.innerHTML = "";
  messageArea.style.display = movies.length ? "none" : "block";

  if (!movies.length) {
    showMessage(
      showingWatchlist ? "Your watchlist is empty" : "No movies found",
      showingWatchlist ? "Save a movie with the heart button and it will appear here." : "Try another title or change the filters."
    );
    return;
  }

  const cards = movies.map(rawMovie => {
    const movie = normalizeMovie(rawMovie);
    const poster = movie.Poster
      ? `<img src="${escapeHTML(movie.Poster)}" alt="${escapeHTML(movie.Title)} poster" loading="lazy">`
      : '<div class="poster-placeholder">✦</div>';
    return `<article class="movie-card" data-id="${escapeHTML(movie.id)}">
      <div class="poster-wrap">
        ${poster}
        <button class="fav-button ${isSaved(movie.id) ? "saved" : ""}" data-fav="${escapeHTML(movie.id)}" aria-label="Add ${escapeHTML(movie.Title)} to watchlist">${isSaved(movie.id) ? "♥" : "♡"}</button>
      </div>
      <div class="movie-info"><h3 class="movie-title" title="${escapeHTML(movie.Title)}">${escapeHTML(movie.Title)}</h3>
      <div class="movie-meta"><span>${escapeHTML(movie.Year)}</span><span class="movie-type">${escapeHTML(movie.Genres[0] || "Movie")}</span></div></div>
    </article>`;
  });
  movieGrid.innerHTML = cards.join("");

  movieGrid.querySelectorAll(".movie-card").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest(".fav-button")) return;
      openMovieDetails(card.dataset.id);
    });
  });

  movieGrid.querySelectorAll(".fav-button").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      toggleWatchlist(button.dataset.fav);
    });
  });
}

function updateFilterOptions(movies) {
  const years = [...new Set(movies.map(movie => String(movie.year)).filter(year => /^\d{4}$/.test(year)))].sort((a, b) => b - a);
  const genres = [...new Set(movies.flatMap(movie => Array.isArray(movie.genres) ? movie.genres : []))].sort();

  yearFilter.innerHTML = '<option value="all">All years</option>' +
    years.map(year => `<option value="${escapeHTML(year)}">${escapeHTML(year)}</option>`).join("");

  genreFilter.innerHTML = '<option value="all">All genres</option>' +
    genres.map(genre => `<option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>`).join("");
}

function applyFilters() {
  const selectedYear = yearFilter.value;
  const selectedGenre = genreFilter.value;
  const filtered = currentMovies.filter(movie => {
    const yearMatch = selectedYear === "all" || String(movie.year) === selectedYear;
    const genreMatch = selectedGenre === "all" || (Array.isArray(movie.genres) && movie.genres.includes(selectedGenre));
    return yearMatch && genreMatch;
  });
  renderMovies(filtered);
}

async function searchMovies(query) {
  if (!query.trim()) {
    showMessage("Enter a movie title", "Type a movie name in the search box to get started.");
    return;
  }

  showingWatchlist = false;
  homeNav.classList.add("active");
  watchlistNav.classList.remove("active");
  sectionEyebrow.textContent = "MOVIE SEARCH";
  sectionTitle.textContent = `Results for "${query.trim()}"`;
  yearFilter.value = "all";
  genreFilter.value = "all";
  showLoading();

  try {
    const response = await fetch(`${API_BASE}?q=${encodeURIComponent(query.trim())}`);
    if (!response.ok) throw new Error(`Request failed (${response.status}). Please try again.`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("The API returned an unexpected response.");

    currentMovies = data;
    updateFilterOptions(currentMovies);
    applyFilters();
  } catch (error) {
    currentMovies = [];
    movieGrid.innerHTML = "";
    showMessage("Something went wrong", error.message || "Could not load movies. Please try again.", "error");
  }
}

async function openMovieDetails(id) {
  modal.classList.remove("hidden");
  modalContent.innerHTML = '<div class="message-area"><div class="empty-icon">…</div><h3>Loading movie details</h3><p>Please wait.</p></div>';

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(response.status === 404 ? "Movie details were not found." : `Request failed (${response.status}).`);
    const rawMovie = await response.json();
    const movie = normalizeMovie(rawMovie);

    modalContent.innerHTML = `<div class="detail-layout">
      ${movie.Poster ? `<img class="detail-poster" src="${escapeHTML(movie.Poster)}" alt="${escapeHTML(movie.Title)} poster">` : '<div class="poster-placeholder">✦</div>'}
      <div class="detail-copy"><p class="eyebrow">MOVIE DETAILS</p><h2 id="modalTitle">${escapeHTML(movie.Title)}</h2>
      <div class="detail-meta">${escapeHTML(movie.Year)} · ${escapeHTML(movie.Runtime)} · ${escapeHTML(movie.Genres.join(", ") || "Genre N/A")}</div>
      <p><span class="detail-rating">★ ${escapeHTML(movie.Rating)}</span> / 10 rating</p>
      <p>${escapeHTML(movie.Plot)}</p>
      <p><span class="detail-label">Director:</span> ${escapeHTML(movie.Director)}</p>
      <p><span class="detail-label">Cast:</span> ${escapeHTML(movie.Actors)}</p>
      <button class="small-button detail-save" id="detailSave">${isSaved(movie.id) ? "♥ Saved to Watchlist" : "♡ Add to Watchlist"}</button></div></div>`;

    document.getElementById("detailSave").addEventListener("click", () => {
      toggleWatchlist(movie.id, rawMovie);
      document.getElementById("detailSave").textContent = isSaved(movie.id) ? "♥ Saved to Watchlist" : "♡ Add to Watchlist";
    });
  } catch (error) {
    modalContent.innerHTML = `<div class="message-area error"><div class="empty-icon">!</div><h3>Unable to load details</h3><p>${escapeHTML(error.message)}</p></div>`;
  }
}

function toggleWatchlist(id, fullMovie = null) {
  const existing = watchlist.find(movie => String(movie.id) === String(id));
  if (existing) {
    watchlist = watchlist.filter(movie => String(movie.id) !== String(id));
  } else {
    const rawMovie = fullMovie || currentMovies.find(item => String(item.id) === String(id));
    if (rawMovie) {
      const movie = normalizeMovie(rawMovie);
      watchlist.push({
        id: movie.id,
        title: movie.Title,
        year: movie.Year,
        genres: movie.Genres,
        poster: movie.Poster,
        director: movie.Director,
        runtimeMinutes: rawMovie.runtimeMinutes,
        rating: rawMovie.rating,
        cast: rawMovie.cast,
        description: rawMovie.description
      });
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  updateWatchlistCount();

  if (showingWatchlist) {
    renderMovies(watchlist);
  } else {
    applyFilters();
  }
}

function showWatchlist() {
  showingWatchlist = true;
  homeNav.classList.remove("active");
  watchlistNav.classList.add("active");
  sectionEyebrow.textContent = "YOUR COLLECTION";
  sectionTitle.textContent = "My Watchlist";
  yearFilter.innerHTML = '<option value="all">All years</option>';
  genreFilter.innerHTML = '<option value="all">All genres</option>';
  renderMovies(watchlist);
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  searchMovies(searchInput.value);
});

document.querySelectorAll(".quick-search").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    searchMovies(button.dataset.query);
  });
});

yearFilter.addEventListener("change", applyFilters);
genreFilter.addEventListener("change", applyFilters);

homeNav.addEventListener("click", () => {
  showingWatchlist = false;
  homeNav.classList.add("active");
  watchlistNav.classList.remove("active");
  sectionEyebrow.textContent = "START EXPLORING";
  sectionTitle.textContent = "Discover movies";
  renderMovies(currentMovies);
});

watchlistNav.addEventListener("click", showWatchlist);

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", closeModal);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

updateWatchlistCount();
