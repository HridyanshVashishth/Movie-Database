class MovieApp {
            constructor() {
                this.API_KEY = '4e44d9029b1270a757cddc766a1bcb63'; // Demo API key
                this.BASE_URL = 'https://api.themoviedb.org/3';
                this.IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
                this.favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
                this.currentView = 'popular'; // 'popular', 'search', 'favorites'
                
                this.initializeElements();
                this.bindEvents();
                this.loadPopularMovies();
            }

            initializeElements() {
                this.searchInput = document.getElementById('searchInput');
                this.searchBtn = document.getElementById('searchBtn');
                this.favoritesBtn = document.getElementById('favoritesBtn');
                this.moviesContainer = document.getElementById('moviesContainer');
                this.loading = document.getElementById('loading');
                this.error = document.getElementById('error');
                this.modal = document.getElementById('movieModal');
                this.closeModal = document.getElementById('closeModal');
                this.modalContent = document.getElementById('modalContent');
            }

            bindEvents() {
                this.searchBtn.addEventListener('click', () => this.searchMovies());
                this.searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.searchMovies();
                });
                this.favoritesBtn.addEventListener('click', () => this.showFavorites());
                this.closeModal.addEventListener('click', () => this.closeMovieModal());
                
                window.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeMovieModal();
                });
            }

            async makeAPICall(endpoint) {
                try {
                    const response = await fetch(`${this.BASE_URL}${endpoint}?api_key=${this.API_KEY}`);
                    if (!response.ok) throw new Error('Network response was not ok');
                    return await response.json();
                } catch (error) {
                    console.error('API call failed:', error);
                    throw error;
                }
            }

            showLoading() {
                this.loading.style.display = 'block';
                this.error.style.display = 'none';
                this.moviesContainer.innerHTML = '';
            }

            hideLoading() {
                this.loading.style.display = 'none';
            }

            showError(message) {
                this.error.textContent = message;
                this.error.style.display = 'block';
                this.hideLoading();
            }

            async loadPopularMovies() {
                this.currentView = 'popular';
                this.showLoading();
                
                try {
                    const data = await this.makeAPICall('/movie/popular');
                    this.displayMovies(data.results);
                    this.hideLoading();
                } catch (error) {
                    this.showError('Failed to load popular movies. Please try again.');
                }
            }

            async searchMovies() {
                const query = this.searchInput.value.trim();
                if (!query) {
                    this.loadPopularMovies();
                    return;
                }

                this.currentView = 'search';
                this.showLoading();

                try {
                    const data = await this.makeAPICall(`/search/movie&query=${encodeURIComponent(query)}`);
                    if (data.results.length === 0) {
                        this.moviesContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
                    } else {
                        this.displayMovies(data.results);
                    }
                    this.hideLoading();
                } catch (error) {
                    this.showError('Failed to search movies. Please try again.');
                }
            }

            showFavorites() {
                this.currentView = 'favorites';
                this.hideLoading();
                
                if (this.favorites.length === 0) {
                    this.moviesContainer.innerHTML = '<div class="no-results">No favorite movies yet. Start adding some!</div>';
                } else {
                    this.displayMovies(this.favorites);
                }
            }

            displayMovies(movies) {
                this.moviesContainer.innerHTML = movies.map(movie => `
                    <div class="movie-card" data-movie-id="${movie.id}">
                        <button class="favorite-btn ${this.isFavorite(movie.id) ? 'active' : ''}" 
                                onclick="movieApp.toggleFavorite(${movie.id}, event)">
                            ${this.isFavorite(movie.id) ? '❤️' : '🤍'}
                        </button>
                        <img src="${movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/250x375?text=No+Image'}" 
                             alt="${movie.title}" class="movie-poster" loading="lazy">
                        <div class="movie-info">
                            <h3 class="movie-title">${movie.title}</h3>
                            <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                            <div class="movie-rating">
                                <span class="star">⭐</span>
                                <span class="rating-text">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
                        </div>
                    </div>
                `).join('');

                // Add click events to movie cards
                document.querySelectorAll('.movie-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('favorite-btn')) {
                            const movieId = card.dataset.movieId;
                            this.showMovieDetails(movieId);
                        }
                    });
                });
            }

            isFavorite(movieId) {
                return this.favorites.some(movie => movie.id == movieId);
            }

            toggleFavorite(movieId, event) {
                event.stopPropagation();
                
                const existingIndex = this.favorites.findIndex(movie => movie.id == movieId);
                const favoriteBtn = event.target;
                
                if (existingIndex !== -1) {
                    // Remove from favorites
                    this.favorites.splice(existingIndex, 1);
                    favoriteBtn.innerHTML = '🤍';
                    favoriteBtn.classList.remove('active');
                } else {
                    // Add to favorites
                    const movieCard = event.target.closest('.movie-card');
                    const movieData = this.getMovieDataFromCard(movieCard);
                    this.favorites.push(movieData);
                    favoriteBtn.innerHTML = '❤️';
                    favoriteBtn.classList.add('active');
                }
                
                localStorage.setItem('movieFavorites', JSON.stringify(this.favorites));
                
                // If we're viewing favorites, refresh the view
                if (this.currentView === 'favorites') {
                    setTimeout(() => this.showFavorites(), 100);
                }
            }

            getMovieDataFromCard(card) {
                const img = card.querySelector('.movie-poster');
                const title = card.querySelector('.movie-title').textContent;
                const year = card.querySelector('.movie-year').textContent;
                const rating = card.querySelector('.rating-text').textContent;
                const overview = card.querySelector('.movie-overview').textContent;
                
                return {
                    id: parseInt(card.dataset.movieId),
                    title: title,
                    release_date: year !== 'N/A' ? `${year}-01-01` : null,
                    vote_average: rating !== 'N/A' ? parseFloat(rating) : 0,
                    overview: overview,
                    poster_path: img.src.includes('placeholder') ? null : img.src.replace(this.IMAGE_BASE_URL, '')
                };
            }

            async showMovieDetails(movieId) {
                try {
                    const movie = await this.makeAPICall(`/movie/${movieId}`);
                    const credits = await this.makeAPICall(`/movie/${movieId}/credits`);
                    
                    const director = credits.crew.find(person => person.job === 'Director');
                    const cast = credits.cast.slice(0, 5);
                    
                    this.modalContent.innerHTML = `
                        <div class="modal-movie-info">
                            <img src="${movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                 alt="${movie.title}" class="modal-poster">
                            <div class="modal-details">
                                <h2>${movie.title}</h2>
                                <div class="modal-meta">
                                    <span class="meta-item">⭐ ${movie.vote_average.toFixed(1)}/10</span>
                                    <span class="meta-item">📅 ${new Date(movie.release_date).getFullYear()}</span>
                                    <span class="meta-item">⏱️ ${movie.runtime} min</span>
                                    ${director ? `<span class="meta-item">🎬 ${director.name}</span>` : ''}
                                </div>
                                <div class="modal-overview">
                                    <strong>Overview:</strong><br>
                                    ${movie.overview || 'No overview available.'}
                                </div>
                                ${movie.genres.length > 0 ? `
                                    <div class="modal-genres">
                                        <strong>Genres:</strong><br>
                                        ${movie.genres.map(genre => `<span class="meta-item">${genre.name}</span>`).join(' ')}
                                    </div>
                                ` : ''}
                                ${cast.length > 0 ? `
                                    <div class="modal-cast">
                                        <strong>Cast:</strong><br>
                                        ${cast.map(actor => actor.name).join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    
                    this.modal.style.display = 'block';
                } catch (error) {
                    console.error('Failed to load movie details:', error);
                }
            }

            closeMovieModal() {
                this.modal.style.display = 'none';
            }
        }

        // Initialize the app
        const movieApp = new MovieApp();