# This script updates playlists collection with thumbnail information.
# For each playlist, it will check all places and add up to 5 thumbnails
# Each thumbnail will include the place_id and image URL

import firebase_admin
from firebase_admin import credentials, firestore
from tqdm import tqdm
import os
from collections import defaultdict
import random

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase-service-account.json")
app = firebase_admin.initialize_app(cred)

db = firestore.client()

# Max batch size for Firestore is 500
BATCH_SIZE = 500
# Maximum number of thumbnails per playlist
MAX_THUMBNAILS = 4

def main():
    print("Starting migration: Adding thumbnails to playlists collection")
    
    # Get all playlists from Firestore
    playlists_ref = db.collection('playlists')
    playlists = list(playlists_ref.get())
    
    print(f"Found {len(playlists)} playlists")
    
    # Get all places from Firestore (to avoid multiple queries)
    places_ref = db.collection('places')
    places = list(places_ref.get())
    
    print(f"Found {len(places)} places")
    
    # Create a dictionary of places for quick lookup
    places_dict = {}
    for place in places:
        place_data = place.to_dict()
        places_dict[place.id] = place_data
    
    # Process playlists in batches
    total_batches = (len(playlists) + BATCH_SIZE - 1) // BATCH_SIZE
    updated_count = 0
    skipped_count = 0
    
    for i in tqdm(range(total_batches), desc="Updating playlists"):
        # Create a new batch
        batch = db.batch()
        
        # Get the current batch of playlists
        start_idx = i * BATCH_SIZE
        end_idx = min((i + 1) * BATCH_SIZE, len(playlists))
        
        # Add each playlist update to the batch
        for j in range(start_idx, end_idx):
            playlist = playlists[j]
            playlist_data = playlist.to_dict()
            
            # Skip if the playlist doesn't have any places
            if 'places' not in playlist_data or not playlist_data['places']:
                skipped_count += 1
                continue
            
            # Get place IDs from the playlist
            place_ids = []
            for place in playlist_data['places']:
                # Handle if place is a document reference
                if hasattr(place, 'id'):
                    place_ids.append(place.id)
                # Handle if place is a string
                elif isinstance(place, str):
                    place_ids.append(place)
            
            # Skip if no valid place IDs
            if not place_ids:
                skipped_count += 1
                continue
            
            # Create thumbnails array for the playlist
            thumbnails = []
            
            # For each place in the playlist, try to get an image URL
            for place_id in place_ids:
                if place_id in places_dict:
                    place_data = places_dict[place_id]
                    
                    # Try to get the first_image first
                    if 'first_image' in place_data and place_data['first_image']:
                        thumbnails.append({
                            'url': place_data['first_image'],
                            'place_id': place_id
                        })
                    # Fallback to images array if available
                    elif 'images' in place_data and place_data['images'] and len(place_data['images']) > 0:
                        thumbnails.append({
                            'url': place_data['images'][0],
                            'place_id': place_id
                        })
                
                # Stop if we have enough thumbnails
                if len(thumbnails) >= MAX_THUMBNAILS:
                    break
            
            # Skip if no thumbnails were generated
            if not thumbnails:
                skipped_count += 1
                continue
            
            # Shuffle thumbnails to get a random selection
            random.shuffle(thumbnails)
            thumbnails = thumbnails[:MAX_THUMBNAILS]
            
            # Update the playlist document with thumbnails
            playlist_ref = db.collection('playlists').document(playlist.id)
            batch.update(playlist_ref, {'thumbnails': thumbnails})
            updated_count += 1
        
        # Commit the batch
        batch.commit()
    
    print(f"Migration complete! Updated {updated_count} playlists with thumbnails.")
    print(f"Skipped {skipped_count} playlists (no places or no images for places).")

if __name__ == "__main__":
    main()
