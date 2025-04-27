# This script addes new field playlist_ids to user collection.
# There's separate playlists collection, which contains the field "owner", which is the user id of the playlist owner.
# We need to update user collection with the playlist_ids field.

import firebase_admin
from firebase_admin import credentials, firestore
from tqdm import tqdm
import os
from collections import defaultdict

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase-service-account.json")
app = firebase_admin.initialize_app(cred)

db = firestore.client()

# Max batch size for Firestore is 500
BATCH_SIZE = 500

def main():
    print("Starting migration: Adding playlist_ids field to users collection")
    
    # Get all playlists from Firestore
    playlists_ref = db.collection('playlists')
    playlists = list(playlists_ref.get())
    
    print(f"Found {len(playlists)} playlists")

    # Group playlists by owner user ID
    user_playlists = defaultdict(list)
    
    for playlist in playlists:
        playlist_data = playlist.to_dict()
        playlist_id = playlist.id
        
        # Skip if no owner field or owner isn't a reference
        if 'owner' not in playlist_data:
            print(f"Skipping playlist {playlist_id} - No owner field")
            continue
            
        owner = playlist_data['owner']
        
        # Handle different types of owner references
        if isinstance(owner, str):
            # If owner is stored as a string path like '/users/userId'
            if owner.startswith('/users/'):
                owner_id = owner.split('/')[2]
                user_playlists[owner_id].append(playlist_id)
            else:
                # If owner is stored directly as user ID
                user_playlists[owner].append(playlist_id)
        elif hasattr(owner, 'path'):
            # If owner is a DocumentReference
            path_parts = owner.path.split('/')
            if len(path_parts) >= 2 and path_parts[-2] == 'users':
                owner_id = path_parts[-1]
                user_playlists[owner_id].append(playlist_id)
    
    # Update users with their playlist IDs in batches
    user_ids = list(user_playlists.keys())
    total_batches = (len(user_ids) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in tqdm(range(total_batches), desc="Updating users"):
        # Create a new batch
        batch = db.batch()
        
        # Get the current batch of user IDs
        start_idx = i * BATCH_SIZE
        end_idx = min((i + 1) * BATCH_SIZE, len(user_ids))
        
        # Add each user update to the batch
        for j in range(start_idx, end_idx):
            user_id = user_ids[j]
            playlist_ids = user_playlists[user_id]
            
            user_ref = db.collection('users').document(user_id)
            batch.update(user_ref, {'playlist_ids': playlist_ids})
        
        # Commit the batch
        batch.commit()
    
    print(f"Migration complete! Updated {len(user_ids)} users with playlist_ids field.")

if __name__ == "__main__":
    main()
