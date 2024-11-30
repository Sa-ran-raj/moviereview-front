const apiBaseUrl = 'http://localhost:8080/api/movies';
let allMovies = []; // Store all movies for filtering
let debounceTimer; // Timer for debouncing

// Load movies on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    document.getElementById('search-bar').addEventListener('input', debounce(filterMovies, 300)); // Debounced search
    document.getElementById('clear-search').addEventListener('click', clearSearch); // Clear search button
});

function loadMovies() {
    document.getElementById('loading-spinner').style.display = 'block'; // Show loading spinner
    fetch(apiBaseUrl)
        .then(response => response.json())
        .then(movies => {
            allMovies = movies; // Store all movies
            displayMovies(allMovies); // Display all movies
            document.getElementById('loading-spinner').style.display = 'none'; // Hide loading spinner
        })
        .catch(error => {
            console.error('Error loading movies:', error);
            document.getElementById('loading-spinner').style.display = 'none'; // Hide loading spinner
        });
}

function displayMovies(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = '';
    movies.forEach(movie => {
        const movieCard = `
            <div class="col-md-4 mb-4">
                <div class="card h-100" onclick="openMovieModal('${movie.id}')">
                    <img src="${movie.posterUrl}" class="card-img-top" alt="${movie.name}">
                    <div class="card-body">
                        <h5 class="card-title">${movie.name}</h5>
                        <p class="card-text">${movie.description.substring(0, 100)}...</p>
                        <div class="review-rating">
                            ${getStarRating(movie.averageRating)}
                        </div>
                    </div>
                </div>
            </div>`;
        movieList.insertAdjacentHTML('beforeend', movieCard);
    });
}

function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function filterMovies() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const filteredMovies = allMovies.filter(movie =>
        movie.name.toLowerCase().includes(searchTerm) ||
        movie.description.toLowerCase().includes(searchTerm)
    );
    displayMovies(filteredMovies);

    // Show or hide the clear button
    document.getElementById('clear-search').style.display = searchTerm ? 'block' : 'none';
}

function clearSearch() {
    document.getElementById('search-bar').value = '';
    displayMovies(allMovies); // Show all movies
    document.getElementById('clear-search').style.display = 'none'; // Hide clear button
}

function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'star' : ''}"></i>`;
    }
    return stars;
}

function openMovieModal(movieId) {
    fetch(`${apiBaseUrl}/${movieId}`)
        .then(response => response.json())
        .then(movie => {
            document.getElementById('movieModalLabel').textContent = movie.name;
            document.getElementById('movie-poster').src = movie.posterUrl;
            document.getElementById('movie-description').textContent = movie.description;

            // Load reviews
            const reviewList = document.getElementById('review-list');
            reviewList.innerHTML = '';
            movie.reviews.forEach(review => {
                const reviewItem = `
                    <li>
                        <strong>${review.reviewer}</strong> (${getStarRating(review.rating)}): ${review.reviewText}
                    </li>`;
                reviewList.insertAdjacentHTML('beforeend', reviewItem);
            });

            // Handle review submission
            document.getElementById('review-form').onsubmit = (event) => {
                event.preventDefault();
                submitReview(movieId);
            };

            $('#movieModal').modal('show');
        })
        .catch(error => console.error('Error loading movie:', error));
}

function submitReview(movieId) {
    const reviewer = document.getElementById('reviewer').value;
    const reviewText = document.getElementById('review-text').value;
    const reviewRating = document.getElementById('review-rating').value;

    fetch(`${apiBaseUrl}/${movieId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reviewer: reviewer,
            reviewText: reviewText,
            rating: parseInt(reviewRating)
        })
    })
    .then(response => response.json())
    .then(updatedMovie => {
        openMovieModal(movieId); // Reload the modal with the updated reviews
        document.getElementById('review-form').reset(); // Clear the form
    })
    .catch(error => console.error('Error submitting review:', error));
}


document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const lightIcon = document.getElementById('lightIcon');
    const darkIcon = document.getElementById('darkIcon');

    // Check local storage for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        lightIcon.classList.add('d-none');
        darkIcon.classList.remove('d-none');
    }

    darkModeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
            lightIcon.classList.remove('d-none');
            darkIcon.classList.add('d-none');
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
            lightIcon.classList.add('d-none');
            darkIcon.classList.remove('d-none');
        }
    });
});

// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyCEvxsyhtiozAdkZac4T_6kHbg21lOKgXU'; // Replace with your actual API key

// Load YouTube API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Initialize when document is ready
$(document).ready(function() {
    loadYouTubeAPI();
});

let player;
let currentTrailerID = null;

// Function to initialize YouTube player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'modestbranding': 1,
            'fs': 1
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

// Handle player state changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        resetTrailerView();
    }
}

// Handle player errors
function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    resetTrailerView();
    showTrailerError();
}

// Reset trailer view
function resetTrailerView() {
    $('#youtube-player').hide();
    $('#trailer-placeholder').show();
}

// Show trailer error message
function showTrailerError() {
    $('#trailer-placeholder').html(`
        <div class="trailer-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Sorry, the trailer is currently unavailable.</p>
            <button class="btn btn-outline-danger mt-2" onclick="resetTrailerPlaceholder()">
                Try Again
            </button>
        </div>
    `);
}

// Reset trailer placeholder to original state
function resetTrailerPlaceholder() {
    $('#trailer-placeholder').html(`
        <button id="watch-trailer" class="btn btn-danger">
            <i class="fas fa-play-circle"></i> Watch Trailer
        </button>
    `);
}

// Function to load and play trailer
async function loadTrailer(movieTitle) {
    try {
        const searchQuery = `${movieTitle} official trailer`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('YouTube API request failed');
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            currentTrailerID = data.items[0].id.videoId;
            return currentTrailerID;
        }
        return null;
    } catch (error) {
        console.error('Error loading trailer:', error);
        return null;
    }
}

// Add click handler for watch trailer button
$(document).on('click', '#watch-trailer', async function() {
    const movieTitle = $('#movieModalLabel').text();
    $('#trailer-placeholder').html(`
        <div class="spinner-border text-danger" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    `);

    const trailerID = await loadTrailer(movieTitle);

    if (trailerID) {
        $('#trailer-placeholder').hide();
        $('#youtube-player').show();
        player.loadVideoById(trailerID);
    } else {
        showTrailerError();
    }
});

// Handle modal close
$('#movieModal').on('hidden.bs.modal', function () {
    if (player) {
        player.stopVideo();
    }
    resetTrailerView();
    resetTrailerPlaceholder();
});

// Add this CSS for error handling
const style = document.createElement('style');
style.textContent = `
    .trailer-error {
        text-align: center;
        color: #dc3545;
        padding: 2rem;
    }

    .trailer-error i {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    .trailer-error p {
        margin-bottom: 0.5rem;
    }
`;
document.head.appendChild(style);