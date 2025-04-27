# This script is used to backup the firebase database to each renamed collection as {collection_name}_bck_{timestamp}

import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import os
from tqdm import tqdm
# Initialize Firebase Admin SDK
cred = credentials.Certificate("firebase-service-account.json")
app = firebase_admin.initialize_app(cred)

db = firestore.client()

timestamp = datetime.datetime.now(datetime.UTC).isoformat()

# Get all collections
collections = db.collections()

# Max batch size for Firestore is 500
BATCH_SIZE = 500

for collection in collections:
    collection_name = collection.id
    collection_data = list(collection.get())
    print(f"Collection {collection_name} has {len(collection_data)} documents")
    
    # Create a new collection with the name {collection_name}_bck_{timestamp}
    new_collection_name = f"{collection_name}_bck_{timestamp}"
    
    # Using batched writes for better performance
    total_batches = (len(collection_data) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in tqdm(range(total_batches), desc=f"Backing up collection {collection_name}"):
        # Create a new batch
        batch = db.batch()
        
        # Get the current batch of documents
        start_idx = i * BATCH_SIZE
        end_idx = min((i + 1) * BATCH_SIZE, len(collection_data))
        
        # Add each document to the batch
        for j in range(start_idx, end_idx):
            doc = collection_data[j]
            doc_ref = db.collection(new_collection_name).document(doc.id)
            batch.set(doc_ref, doc.to_dict())
        
        # Commit the batch
        batch.commit()
        
    print(f"Backup of collection {collection_name} created in {new_collection_name} with {len(collection_data)} documents.")