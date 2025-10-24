// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const gallery = document.getElementById('gallery');
const deleteModal = document.getElementById('deleteModal');
const cancelBtn = document.querySelector('.cancel-btn');
const confirmBtn = document.querySelector('.confirm-btn');
const profilePicContainer = document.querySelector('.profile-pic-container');
const profilePicInput = document.getElementById('profilePicInput');
const profilePicture = document.getElementById('profilePicture');
const selectedFilesDiv = document.getElementById('selectedFiles');
const fileListDiv = document.getElementById('fileList');
const editBioBtn = document.getElementById('editBioBtn');
const bioDisplay = document.getElementById('bioDisplay');
const bioEdit = document.getElementById('bioEdit');
const bioTextarea = document.getElementById('bioTextarea');
const saveBioBtn = document.getElementById('saveBio');
const cancelBioBtn = document.getElementById('cancelBio');
const bioText = document.getElementById('bioText');
const darkModeToggle = document.getElementById('darkModeToggle');

// Photo Viewer Elements
const photoViewer = document.getElementById('photoViewer');
const viewerImage = document.getElementById('viewerImage');
const viewerBody = document.getElementById('viewerBody');
const viewerClose = document.getElementById('viewerClose');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetZoomBtn = document.getElementById('resetZoom');
const downloadBtn = document.getElementById('downloadBtn');
const imageInfo = document.getElementById('imageInfo');
const zoomLevel = document.getElementById('zoomLevel');

let photoToDelete = null;
let selectedFiles = [];
let currentZoom = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let currentImageId = null;

// Initialize the application
function initializeApp() {
    loadGalleryFromStorage();
    loadBioFromStorage();
    loadProfilePicFromStorage();
    loadDarkMode();
    
    // Initialize upload button state
    uploadBtn.disabled = true;
    
    // Add dark mode toggle event listener
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Enhanced localStorage functions with error handling
function getStorageItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error('Error writing to localStorage:', error);
        // If localStorage is full, try to clear some space
        if (error.name === 'QuotaExceededError') {
            clearOldImages();
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error('Still unable to save after clearing space:', e);
            }
        }
        return false;
    }
}

function clearOldImages() {
    try {
        const savedGallery = localStorage.getItem('gallery');
        if (savedGallery) {
            const images = JSON.parse(savedGallery);
            // Keep only the most recent 50 images
            if (images.length > 50) {
                const recentImages = images.slice(0, 50);
                localStorage.setItem('gallery', JSON.stringify(recentImages));
            }
        }
    } catch (error) {
        console.error('Error clearing old images:', error);
    }
}

// Load gallery from localStorage
function loadGalleryFromStorage() {
    const savedGallery = getStorageItem('gallery');
    if (savedGallery) {
        try {
            const images = JSON.parse(savedGallery);
            images.forEach(imgData => {
                const galleryItem = createGalleryItem(imgData.src, imgData.id);
                gallery.appendChild(galleryItem);
            });
        } catch (error) {
            console.error('Error parsing gallery data:', error);
        }
    }
}

// Load bio from localStorage
function loadBioFromStorage() {
    const savedBio = getStorageItem('bio');
    if (savedBio) {
        bioText.innerHTML = savedBio.replace(/\n/g, '<br>');
        bioTextarea.value = savedBio;
    }
}

// Load profile picture from localStorage
function loadProfilePicFromStorage() {
    const savedProfilePic = getStorageItem('profilePicture');
    if (savedProfilePic) {
        profilePicture.src = savedProfilePic;
    }
}

// Load dark mode preference
function loadDarkMode() {
    const isDarkMode = getStorageItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        setStorageItem('darkMode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        setStorageItem('darkMode', 'true');
    }
}

// Create a gallery item element
function createGalleryItem(imgSrc, id) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-id', id);
    galleryItem.innerHTML = `
        <img src="${imgSrc}" alt="Gallery Image" loading="lazy">
        <div class="gallery-item-overlay">
            <i class="fas fa-expand"></i>
            <i class="fas fa-trash delete-btn"></i>
        </div>
    `;
    
    // Add click event to open photo viewer
    const imgElement = galleryItem.querySelector('img');
    imgElement.addEventListener('click', () => {
        openPhotoViewer(imgSrc, id);
    });
    
    // Add event listener to delete button
    const deleteBtn = galleryItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteClick(galleryItem);
    });
    
    // Add event listener to expand button
    const expandBtn = galleryItem.querySelector('.fa-expand');
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPhotoViewer(imgSrc, id);
    });
    
    return galleryItem;
}

// Open photo viewer
function openPhotoViewer(imgSrc, id) {
    viewerImage.src = imgSrc;
    currentImageId = id;
    resetZoomAndPosition();
    photoViewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Set image info
    const img = new Image();
    img.onload = function() {
        imageInfo.textContent = `${img.naturalWidth} × ${img.naturalHeight} pixels`;
    };
    img.src = imgSrc;
    
    updateZoomLevel();
}

// Close photo viewer
function closePhotoViewer() {
    photoViewer.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetZoomAndPosition();
}

// Reset zoom and position
function resetZoomAndPosition() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
    viewerBody.style.cursor = 'grab';
}

// Update image transform with zoom and translation
function updateImageTransform() {
    viewerImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

// Update zoom level display
function updateZoomLevel() {
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

// Zoom functionality
function zoomIn() {
    if (currentZoom < 5) {
        currentZoom += 0.25;
        updateImageTransform();
        updateZoomLevel();
    }
}

function zoomOut() {
    if (currentZoom > 0.5) {
        currentZoom -= 0.25;
        updateImageTransform();
        updateZoomLevel();
    }
}

function resetZoom() {
    resetZoomAndPosition();
    updateZoomLevel();
}

// Download image
function downloadImage() {
    const link = document.createElement('a');
    link.download = `photo-${currentImageId}.jpg`;
    link.href = viewerImage.src;
    link.click();
}

// Drag to pan functionality
function startDrag(e) {
    if (currentZoom <= 1) return;
    
    isDragging = true;
    viewerBody.style.cursor = 'grabbing';
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
}

function dragImage(e) {
    if (!isDragging || currentZoom <= 1) return;
    
    e.preventDefault();
    const x = e.clientX - startX;
    const y = e.clientY - startY;
    
    // Calculate bounds to prevent dragging beyond image edges
    const containerRect = viewerBody.getBoundingClientRect();
    const imageRect = viewerImage.getBoundingClientRect();
    const scaledWidth = imageRect.width / currentZoom;
    const scaledHeight = imageRect.height / currentZoom;
    
    const maxX = Math.max(0, (scaledWidth * currentZoom - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight * currentZoom - containerRect.height) / 2);
    
    translateX = Math.max(-maxX, Math.min(maxX, x));
    translateY = Math.max(-maxY, Math.min(maxY, y));
    
    updateImageTransform();
}

function stopDrag() {
    isDragging = false;
    if (currentZoom > 1) {
        viewerBody.style.cursor = 'grab';
    } else {
        viewerBody.style.cursor = 'default';
    }
}

// Upload area click event
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File input change event
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFiles = Array.from(e.target.files);
        displaySelectedFiles();
        selectedFilesDiv.style.display = 'block';
        uploadBtn.disabled = false;
    }
});

// Display selected files
function displaySelectedFiles() {
    fileListDiv.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name}</span>
            <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
        `;
        fileListDiv.appendChild(fileItem);
    });
}

// Upload button click event
uploadBtn.addEventListener('click', () => {
    if (selectedFiles.length > 0) {
        let uploadCount = 0;
        const totalFiles = selectedFiles.length;
        
        selectedFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create new gallery item
                const id = Date.now() + Math.random();
                const galleryItem = createGalleryItem(e.target.result, id);
                
                // Add to gallery
                gallery.prepend(galleryItem);
                
                // Save to localStorage
                saveImageToStorage(e.target.result, id);
                
                uploadCount++;
                
                // If all files are processed, show success message
                if (uploadCount === totalFiles) {
                    resetUploadSection();
                    alert(`${totalFiles} photo(s) uploaded successfully!`);
                }
            };
            
            reader.onerror = function() {
                uploadCount++;
                console.error('Error reading file:', file.name);
                if (uploadCount === totalFiles) {
                    resetUploadSection();
                    alert('Some photos failed to upload. Please try again.');
                }
            };
            
            reader.readAsDataURL(file);
        });
    } else {
        alert('Please select photos to upload.');
    }
});

// Save image to localStorage
function saveImageToStorage(imgSrc, id) {
    const savedGallery = getStorageItem('gallery');
    const images = savedGallery ? JSON.parse(savedGallery) : [];
    images.unshift({ src: imgSrc, id: id });
    const success = setStorageItem('gallery', JSON.stringify(images));
    if (!success) {
        console.warn('Failed to save image to localStorage');
    }
}

// Reset upload section after upload
function resetUploadSection() {
    selectedFiles = [];
    fileInput.value = '';
    selectedFilesDiv.style.display = 'none';
    uploadBtn.disabled = true;
}

// Profile picture change functionality
profilePicContainer.addEventListener('click', () => {
    profilePicInput.click();
});

profilePicInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            profilePicture.src = e.target.result;
            const success = setStorageItem('profilePicture', e.target.result);
            if (success) {
                alert('Profile picture updated successfully!');
            } else {
                alert('Profile picture updated, but failed to save to storage.');
            }
        };
        
        reader.onerror = function() {
            alert('Error reading the selected file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }
});

// Bio editing functionality
editBioBtn.addEventListener('click', () => {
    bioDisplay.style.display = 'none';
    bioEdit.style.display = 'block';
    editBioBtn.style.display = 'none';
});

saveBioBtn.addEventListener('click', () => {
    const newBio = bioTextarea.value;
    bioText.innerHTML = newBio.replace(/\n/g, '<br>');
    const success = setStorageItem('bio', newBio);
    
    bioEdit.style.display = 'none';
    bioDisplay.style.display = 'block';
    editBioBtn.style.display = 'block';
    
    if (success) {
        alert('Bio updated successfully!');
    } else {
        alert('Bio updated, but failed to save to storage.');
    }
});

cancelBioBtn.addEventListener('click', () => {
    bioEdit.style.display = 'none';
    bioDisplay.style.display = 'block';
    editBioBtn.style.display = 'block';
    // Reset textarea to current bio
    bioTextarea.value = getStorageItem('bio') || bioTextarea.value;
});

// Delete button click handler
function handleDeleteClick(galleryItem) {
    photoToDelete = galleryItem;
    deleteModal.style.display = 'flex';
}

// Cancel delete
cancelBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    photoToDelete = null;
});

// Confirm delete
confirmBtn.addEventListener('click', () => {
    if (photoToDelete) {
        const id = photoToDelete.getAttribute('data-id');
        
        // Remove from DOM
        photoToDelete.remove();
        
        // Remove from localStorage
        removeImageFromStorage(id);
        
        deleteModal.style.display = 'none';
        photoToDelete = null;
        alert('Photo deleted successfully!');
    }
});

// Remove image from localStorage
function removeImageFromStorage(id) {
    const savedGallery = getStorageItem('gallery');
    if (savedGallery) {
        const images = JSON.parse(savedGallery);
        const filteredImages = images.filter(img => img.id != id);
        setStorageItem('gallery', JSON.stringify(filteredImages));
    }
}

// Photo Viewer Event Listeners
viewerClose.addEventListener('click', closePhotoViewer);
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
resetZoomBtn.addEventListener('click', resetZoom);
downloadBtn.addEventListener('click', downloadImage);

// Drag events for panning
viewerBody.addEventListener('mousedown', startDrag);
viewerBody.addEventListener('mousemove', dragImage);
viewerBody.addEventListener('mouseup', stopDrag);
viewerBody.addEventListener('mouseleave', stopDrag);

// Touch events for mobile
viewerBody.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrag(e.touches[0]);
});

viewerBody.addEventListener('touchmove', (e) => {
    e.preventDefault();
    dragImage(e.touches[0]);
});

viewerBody.addEventListener('touchend', stopDrag);

// Close viewer when clicking outside the image
photoViewer.addEventListener('click', (e) => {
    if (e.target === photoViewer) {
        closePhotoViewer();
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (photoViewer.style.display === 'flex') {
        switch(e.key) {
            case 'Escape':
                closePhotoViewer();
                break;
            case '+':
            case '=':
                zoomIn();
                break;
            case '-':
                zoomOut();
                break;
            case '0':
                resetZoom();
                break;
        }
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);