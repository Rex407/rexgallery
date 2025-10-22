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

let photoToDelete = null;
let selectedFiles = [];

// Initialize the application
function initializeApp() {
    loadGalleryFromStorage();
    loadBioFromStorage();
    loadProfilePicFromStorage();
}

// Load gallery from localStorage
function loadGalleryFromStorage() {
    const savedGallery = localStorage.getItem('gallery');
    if (savedGallery) {
        const images = JSON.parse(savedGallery);
        images.forEach(imgData => {
            const galleryItem = createGalleryItem(imgData.src, imgData.id);
            gallery.appendChild(galleryItem);
        });
    }
}

// Load bio from localStorage
function loadBioFromStorage() {
    const savedBio = localStorage.getItem('bio');
    if (savedBio) {
        bioText.innerHTML = savedBio.replace(/\n/g, '<br>');
        bioTextarea.value = savedBio;
    }
}

// Load profile picture from localStorage
function loadProfilePicFromStorage() {
    const savedProfilePic = localStorage.getItem('profilePicture');
    if (savedProfilePic) {
        profilePicture.src = savedProfilePic;
    }
}

// Create a gallery item element
function createGalleryItem(imgSrc, id) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-id', id);
    galleryItem.innerHTML = `
        <img src="${imgSrc}" alt="Gallery Image">
        <div class="gallery-item-overlay">
            <i class="fas fa-expand"></i>
            <i class="fas fa-trash delete-btn"></i>
        </div>
    `;
    
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
        window.open(imgSrc, '_blank');
    });
    
    return galleryItem;
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
                if (uploadCount === selectedFiles.length) {
                    resetUploadSection();
                    alert(`${selectedFiles.length} photo(s) uploaded successfully!`);
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
    const savedGallery = localStorage.getItem('gallery');
    const images = savedGallery ? JSON.parse(savedGallery) : [];
    images.unshift({ src: imgSrc, id: id });
    localStorage.setItem('gallery', JSON.stringify(images));
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
            localStorage.setItem('profilePicture', e.target.result);
            alert('Profile picture updated successfully!');
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
    localStorage.setItem('bio', newBio);
    
    bioEdit.style.display = 'none';
    bioDisplay.style.display = 'block';
    editBioBtn.style.display = 'block';
    
    alert('Bio updated successfully!');
});

cancelBioBtn.addEventListener('click', () => {
    bioEdit.style.display = 'none';
    bioDisplay.style.display = 'block';
    editBioBtn.style.display = 'block';
    // Reset textarea to current bio
    bioTextarea.value = localStorage.getItem('bio') || bioTextarea.value;
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
    const savedGallery = localStorage.getItem('gallery');
    if (savedGallery) {
        const images = JSON.parse(savedGallery);
        const filteredImages = images.filter(img => img.id != id);
        localStorage.setItem('gallery', JSON.stringify(filteredImages));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);