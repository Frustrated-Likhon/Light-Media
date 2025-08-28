// Media Server JavaScript
class LightMediaPlayer {
    constructor() {
        this.currentPlayer = null;
        this.isFullscreen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
        this.restoreViewPreference();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchMedia(e.target.value));
        }

        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewType = e.target.closest('.view-btn').getAttribute('onclick').match(/'([^']+)'/)[1];
                this.setView(viewType);
            });
        });

        // Lazy loading for images
        this.setupLazyLoading();

        // Infinite scroll (if needed)
        this.setupInfiniteScroll();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts (work anywhere on the page)
            if (e.key === '/') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Player-specific shortcuts
            if (this.currentPlayer) {
                this.handlePlayerShortcuts(e);
            }
        });
    }

    handlePlayerShortcuts(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.skip(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.skip(10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.adjustVolume(0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.adjustVolume(-0.1);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                this.toggleMute();
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                this.seekToPercentage(parseInt(e.key) * 10);
                break;
        }
    }

    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            const duration = touchEndTime - touchStartTime;

            // Horizontal swipe (seek)
            if (Math.abs(diffX) > 50 && Math.abs(diffY) < 50 && duration < 300) {
                if (this.currentPlayer) {
                    if (diffX > 0) {
                        this.skip(10); // Swipe right = forward
                    } else {
                        this.skip(-10); // Swipe left = backward
                    }
                }
            }

            // Vertical swipe (volume/brigthness)
            if (Math.abs(diffY) > 50 && Math.abs(diffX) < 50 && duration < 300) {
                if (this.currentPlayer) {
                    if (diffY > 0) {
                        this.adjustVolume(-0.1); // Swipe down = volume down
                    } else {
                        this.adjustVolume(0.1); // Swipe up = volume up
                    }
                }
            }

            // Double tap (play/pause)
            if (duration < 300) {
                if (this.lastTouchTime && Date.now() - this.lastTouchTime < 300) {
                    this.togglePlay();
                }
                this.lastTouchTime = Date.now();
            }
        });
    }

    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const lazyLoad = () => {
            lazyImages.forEach(img => {
                if (img.getBoundingClientRect().top <= window.innerHeight && img.getBoundingClientRect().bottom >= 0) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        };

        // Load images that are already in view
        lazyLoad();

        // Load images on scroll
        window.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
    }

    setupInfiniteScroll() {
        let loading = false;

        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
                loading = true;
                this.loadMoreMedia().finally(() => {
                    loading = false;
                });
            }
        });
    }

    async loadMoreMedia() {
        // This would typically make an API call to load more media
        // For now, it's a placeholder for future implementation
        console.log('Loading more media...');
    }

    searchMedia(query) {
        const mediaCards = document.querySelectorAll('.media-card');
        const queryLower = query.toLowerCase();

        mediaCards.forEach(card => {
            const title = card.querySelector('.media-title').textContent.toLowerCase();
            const type = card.getAttribute('data-type');
            
            if (title.includes(queryLower) || type.includes(queryLower)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    setView(viewType) {
        const mediaView = document.getElementById('media-view');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        viewBtns.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        if (viewType === 'grid') {
            mediaView.classList.remove('list-view');
            mediaView.classList.add('grid-view');
            localStorage.setItem('viewPreference', 'grid');
        } else {
            mediaView.classList.remove('grid-view');
            mediaView.classList.add('list-view');
            localStorage.setItem('viewPreference', 'list');
        }
    }

    restoreViewPreference() {
        const preferredView = localStorage.getItem('viewPreference') || 'grid';
        const mediaView = document.getElementById('media-view');
        const viewBtns = document.querySelectorAll('.view-btn');

        if (mediaView) {
            if (preferredView === 'grid') {
                mediaView.classList.add('grid-view');
                viewBtns[0].classList.add('active');
            } else {
                mediaView.classList.add('list-view');
                viewBtns[1].classList.add('active');
            }
        }
    }

    // Player control methods
    playMedia(filePath) {
        window.open(`/player?file=${encodeURIComponent(filePath)}`, '_blank');
    }

    togglePlay() {
        if (this.currentPlayer) {
            if (this.currentPlayer.paused) {
                this.currentPlayer.play();
            } else {
                this.currentPlayer.pause();
            }
        }
    }

    skip(seconds) {
        if (this.currentPlayer) {
            this.currentPlayer.currentTime += seconds;
        }
    }

    adjustVolume(delta) {
        if (this.currentPlayer) {
            this.currentPlayer.volume = Math.max(0, Math.min(1, this.currentPlayer.volume + delta));
        }
    }

    toggleMute() {
        if (this.currentPlayer) {
            this.currentPlayer.muted = !this.currentPlayer.muted;
        }
    }

    seekToPercentage(percentage) {
        if (this.currentPlayer && this.currentPlayer.duration) {
            this.currentPlayer.currentTime = (percentage / 100) * this.currentPlayer.duration;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
            this.isFullscreen = true;
        } else {
            document.exitFullscreen();
            this.isFullscreen = false;
        }
    }

    // Utility methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Initialize player when page loads
    initializePlayer() {
        this.currentPlayer = document.getElementById('media-player');
        
        if (this.currentPlayer) {
            this.setupPlayerEvents();
        }
    }

    setupPlayerEvents() {
        const progressBar = document.getElementById('progress-bar');
        const volumeBar = document.getElementById('volume-bar');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        const playIcon = document.getElementById('play-icon');

        if (this.currentPlayer && progressBar && volumeBar) {
            this.currentPlayer.addEventListener('loadedmetadata', () => {
                if (durationEl) {
                    durationEl.textContent = this.formatTime(this.currentPlayer.duration);
                }
                volumeBar.value = this.currentPlayer.volume;
            });

            this.currentPlayer.addEventListener('timeupdate', () => {
                if (this.currentPlayer.duration && progressBar && currentTimeEl) {
                    const percent = (this.currentPlayer.currentTime / this.currentPlayer.duration) * 100;
                    progressBar.value = percent;
                    currentTimeEl.textContent = this.formatTime(this.currentPlayer.currentTime);
                }
            });

            this.currentPlayer.addEventListener('play', () => {
                if (playIcon) {
                    playIcon.className = 'fas fa-pause';
                }
            });

            this.currentPlayer.addEventListener('pause', () => {
                if (playIcon) {
                    playIcon.className = 'fas fa-play';
                }
            });

            this.currentPlayer.addEventListener('ended', () => {
                if (playIcon) {
                    playIcon.className = 'fas fa-play';
                }
                this.currentPlayer.currentTime = 0;
            });

            // Progress bar seeking
            progressBar.addEventListener('input', (e) => {
                if (this.currentPlayer.duration) {
                    this.currentPlayer.currentTime = (e.target.value / 100) * this.currentPlayer.duration;
                }
            });

            // Volume control
            volumeBar.addEventListener('input', (e) => {
                this.currentPlayer.volume = e.target.value;
            });
        }
    }

    // File operations
    async downloadFile(filePath, fileName) {
        try {
            const response = await fetch(`/media/${filePath}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try again.');
        }
    }

    // Favorite system (local storage based)
    toggleFavorite(filePath) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
        
        if (favorites[filePath]) {
            delete favorites[filePath];
        } else {
            favorites[filePath] = true;
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.updateFavoriteUI(filePath);
    }

    updateFavoriteUI(filePath) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
        const favoriteBtn = document.querySelector(`[data-file="${filePath}"]`);
        
        if (favoriteBtn) {
            if (favorites[filePath]) {
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                favoriteBtn.classList.add('favorited');
            } else {
                favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                favoriteBtn.classList.remove('favorited');
            }
        }
    }

    // Playlist functionality
    addToPlaylist(filePath) {
        const playlist = JSON.parse(localStorage.getItem('playlist') || '[]');
        
        if (!playlist.includes(filePath)) {
            playlist.push(filePath);
            localStorage.setItem('playlist', JSON.stringify(playlist));
            this.showNotification('Added to playlist');
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the media player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mediaPlayer = new LightMediaPlayer();
    
    // Initialize player if we're on the player page
    if (document.getElementById('media-player')) {
        window.mediaPlayer.initializePlayer();
    }

    // Add favorite buttons to media cards
    const mediaCards = document.querySelectorAll('.media-card');
    mediaCards.forEach(card => {
        const filePath = card.querySelector('.play-btn').getAttribute('onclick').match(/'([^']+)'/)[1];
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'action-btn favorite-btn';
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        favoriteBtn.setAttribute('data-file', filePath);
        favoriteBtn.onclick = () => window.mediaPlayer.toggleFavorite(filePath);
        
        const actions = card.querySelector('.media-actions');
        if (actions) {
            actions.appendChild(favoriteBtn);
        }

        // Update initial favorite state
        window.mediaPlayer.updateFavoriteUI(filePath);
    });
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Export for global access
window.LightMediaPlayer = LightMediaPlayer;