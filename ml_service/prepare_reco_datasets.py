"""
Preprocessing script to convert raw datasets into recommendation engine format.

Inputs:
- ai_mental_wellbeing_dataset.csv
- music_sentiment_dataset.csv

Outputs:
- items.csv: item_id, title, category, tags (comma-separated)
- interactions.csv: user_id index, item_id columns, implicit rating values
"""

import os
import pandas as pd
import numpy as np

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'datasets', 'reco')
AI_WELLBEING = os.path.join(DATA_DIR, 'ai_mental_wellbeing_dataset.csv')
MUSIC_SENTIMENT = os.path.join(DATA_DIR, 'music_sentiment_dataset.csv')
ITEMS_OUT = os.path.join(DATA_DIR, 'items.csv')
INTERACTIONS_OUT = os.path.join(DATA_DIR, 'interactions.csv')


def process_ai_wellbeing():
    """
    Extract interventions and interactions from ai_mental_wellbeing_dataset.
    
    Items: each unique ai_response_category + intervention_effectiveness category
    Users: student_id
    Interactions: student_id x intervention, valued by intervention_effectiveness_score
    """
    df = pd.read_csv(AI_WELLBEING)
    
    # Create items from unique ai_response_category + personalization_type combos
    items = []
    item_id_counter = 1
    
    # Group by ai_response_category and personalization_type to create unique items
    unique_interventions = df[['ai_response_category', 'personalization_type']].drop_duplicates()
    
    for _, row in unique_interventions.iterrows():
        category = row['ai_response_category']
        ptype = row['personalization_type']
        item_id = f"ai_{category}_{ptype}".replace(' ', '_').lower()
        items.append({
            'item_id': item_id,
            'title': f"{category.capitalize()} ({ptype})",
            'category': 'Intervention',
            'tags': f"ai,{category},{ptype}".lower()
        })
    
    # Build interactions: student_id x item_id with effectiveness scores
    interactions = []
    for student in df['student_id'].unique():
        student_df = df[df['student_id'] == student]
        user_interactions = {'user_id': student}
        
        for _, row in student_df.iterrows():
            category = row['ai_response_category']
            ptype = row['personalization_type']
            item_id = f"ai_{category}_{ptype}".replace(' ', '_').lower()
            effectiveness = row['intervention_effectiveness_score']
            
            # Accumulate scores if same item appears multiple times
            if item_id in user_interactions:
                user_interactions[item_id] += effectiveness
            else:
                user_interactions[item_id] = effectiveness
        
        interactions.append(user_interactions)
    
    return pd.DataFrame(items), pd.DataFrame(interactions)


def process_music_sentiment():
    """
    Extract songs and user preferences from music_sentiment_dataset.
    
    Items: unique songs
    Users: User_ID
    Interactions: User_ID x Song_ID with implicit rating (1.0 if recommended)
    """
    df = pd.read_csv(MUSIC_SENTIMENT)
    
    # Create items from unique songs
    items = []
    song_map = {}
    
    for _, row in df[['Recommended_Song_ID', 'Song_Name', 'Artist', 'Genre', 'Mood']].drop_duplicates().iterrows():
        song_id = str(row['Recommended_Song_ID']).lower().replace(' ', '_')
        items.append({
            'item_id': song_id,
            'title': f"{row['Song_Name']} - {row['Artist']}",
            'category': 'Music',
            'tags': f"music,{row['Genre']},{row['Mood']}".lower().replace(' ', '_')
        })
        song_map[row['Recommended_Song_ID']] = song_id
    
    # Build interactions: User_ID x Song_ID
    interactions = []
    for user in df['User_ID'].unique():
        user_df = df[df['User_ID'] == user]
        user_interactions = {'user_id': user}
        
        for _, row in user_df.iterrows():
            song_id = song_map.get(row['Recommended_Song_ID'])
            if song_id:
                # Implicit rating: 1.0 for recommended songs
                # Could also use Energy/Danceability as weights
                user_interactions[song_id] = 1.0
        
        interactions.append(user_interactions)
    
    return pd.DataFrame(items), pd.DataFrame(interactions)


def merge_and_save():
    """Merge both datasets and save standardized CSVs."""
    print("Processing AI Wellbeing dataset...")
    ai_items, ai_interactions = process_ai_wellbeing()
    print(f"  Items: {len(ai_items)}, User interactions: {len(ai_interactions)}")
    
    print("Processing Music Sentiment dataset...")
    music_items, music_interactions = process_music_sentiment()
    print(f"  Items: {len(music_items)}, User interactions: {len(music_interactions)}")
    
    # Merge items
    all_items = pd.concat([ai_items, music_items], ignore_index=True)
    print(f"\nTotal items: {len(all_items)}")
    
    # Merge interactions (outer join on user_id)
    all_interactions = pd.concat([ai_interactions, music_interactions], ignore_index=True)
    # Group by user_id and sum (in case same user appears in both datasets)
    all_interactions = all_interactions.groupby('user_id', as_index=False).sum()
    
    # Pivot to wide format: user_id as index, item_id as columns
    interaction_matrix = all_interactions.set_index('user_id')
    
    # Ensure all items have columns in interaction matrix
    for item_id in all_items['item_id']:
        if item_id not in interaction_matrix.columns:
            interaction_matrix[item_id] = 0.0
    
    # Reorder columns to match items order
    interaction_matrix = interaction_matrix[all_items['item_id'].tolist()]
    interaction_matrix = interaction_matrix.fillna(0.0)
    
    print(f"Interaction matrix shape: {interaction_matrix.shape}")
    print(f"  Users: {interaction_matrix.shape[0]}")
    print(f"  Items: {interaction_matrix.shape[1]}")
    print(f"  Non-zero interactions: {(interaction_matrix > 0).sum().sum()}")
    
    # Save
    all_items.to_csv(ITEMS_OUT, index=False)
    interaction_matrix.to_csv(INTERACTIONS_OUT)
    
    print(f"\n✅ Saved:")
    print(f"  - {ITEMS_OUT}")
    print(f"  - {INTERACTIONS_OUT}")
    
    return all_items, interaction_matrix


if __name__ == "__main__":
    items_df, interactions_df = merge_and_save()
    
    # Quick summary
    print("\n" + "="*60)
    print("DATASET SUMMARY")
    print("="*60)
    print("\nItem categories:")
    print(items_df['category'].value_counts())
    print("\nSample items:")
    print(items_df.head(10)[['item_id', 'title', 'category']])
    print("\nInteraction stats:")
    print(f"  Mean interactions per user: {(interactions_df > 0).sum(axis=1).mean():.2f}")
    print(f"  Mean interactions per item: {(interactions_df > 0).sum(axis=0).mean():.2f}")
