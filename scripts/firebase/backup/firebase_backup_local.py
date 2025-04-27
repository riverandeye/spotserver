# This script is used to backup the firebase database to a local json file.

import firebase_admin
import json
from firebase_admin import credentials, firestore
import datetime
import os

# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase-service-account.json")
app = firebase_admin.initialize_app(cred)


db = firestore.client()

# Get all collections
collections = db.collections()
timestamp = datetime.datetime.now(datetime.UTC).isoformat()

# Backup each collection to a json file

for collection in collections:
    collection_name = collection.id
    collection_data = collection.get()
    
    # Create a serializable dictionary to store the collection data
    collection_dict = {}
    
    for doc in collection_data:
        doc_id = doc.id
        doc_data = doc.to_dict()
        # Add this document to our collection dictionary
        collection_dict[doc_id] = doc_data
        
    # create a folder with the timestamp
    os.makedirs(f"scripts/firebase/backup/local/{timestamp}", exist_ok=True)
    
    # Save the collection data to a json file
    with open(f"scripts/firebase/backup/local/{timestamp}/{collection_name}.json", "w") as f:
        json.dump(collection_dict, f, indent=2, default=str)
