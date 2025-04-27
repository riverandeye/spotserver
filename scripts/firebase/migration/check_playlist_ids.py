# Script to check users with playlist_ids field

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase-service-account.json")
app = firebase_admin.initialize_app(cred)

db = firestore.client()

def main():
    print("Checking users with playlist_ids field...")
    
    # Get all users from Firestore
    users_ref = db.collection('users')
    users = list(users_ref.get())
    
    users_with_playlist_ids = 0
    
    for user in users:
        user_data = user.to_dict()
        if 'playlist_ids' in user_data:
            users_with_playlist_ids += 1
            print(f"\nUser ID: {user.id}")
            print(f"Display name: {user_data.get('display_name', 'N/A')}")
            print(f"Playlist IDs: {user_data['playlist_ids']}")
            
            # Only print first 5 users to avoid overwhelming output
            if users_with_playlist_ids >= 5:
                break
    
    print(f"\nTotal users checked: {len(users)}")
    print(f"Users with playlist_ids field: {users_with_playlist_ids}")

if __name__ == "__main__":
    main() 