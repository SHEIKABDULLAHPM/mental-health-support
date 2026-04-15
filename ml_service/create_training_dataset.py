"""
Dataset Generator for BiLSTM Training
Creates sample CSV datasets with mental health text data
"""
import pandas as pd
import random
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BOLD = '\033[1m'
    END = '\033[0m'


def colored(text, color):
    return f"{color}{text}{Colors.END}"


def print_header(text):
    print("\n" + colored("="*80, Colors.BOLD))
    print(colored(f"  {text}", Colors.HEADER + Colors.BOLD))
    print(colored("="*80, Colors.BOLD))


# Sample templates for each mental health category
SAMPLE_DATA = {
    "Anxiety": [
        "I'm feeling extremely anxious and worried about everything",
        "Can't stop overthinking, my mind won't rest",
        "Having panic attacks and feeling nervous all the time",
        "I feel restless and can't calm down",
        "Constant worry is consuming me",
        "My heart races and I feel scared for no reason",
        "I'm always on edge and expecting something bad to happen",
        "Can't sleep because of racing thoughts",
        "Feel like I'm going to have a panic attack",
        "Everything makes me anxious lately"
    ],
    "Bipolar": [
        "My mood swings drastically from happy to sad",
        "One moment I'm full of energy, next I'm completely drained",
        "I feel manic and can't stop doing things",
        "My emotions are like a roller coaster",
        "Sometimes I'm incredibly productive, other times I can't get out of bed",
        "I go from extreme happiness to deep sadness quickly",
        "My energy levels fluctuate wildly",
        "I experience intense mood episodes",
        "Can't stabilize my emotions",
        "Feel euphoric one day, hopeless the next"
    ],
    "Depression": [
        "I feel so hopeless and empty inside",
        "Nothing brings me joy anymore",
        "I'm constantly sad and can't find motivation",
        "Life feels meaningless and dark",
        "Can't get out of bed, everything feels heavy",
        "I've lost interest in everything I used to enjoy",
        "Feel numb and disconnected from the world",
        "Crying all the time without knowing why",
        "No energy to do anything",
        "Everything feels pointless and overwhelming"
    ],
    "Normal": [
        "Having a good day today, feeling positive",
        "Everything is going well, I'm content",
        "Feeling balanced and happy with life",
        "Today was productive and satisfying",
        "I'm in a good mood and enjoying my day",
        "Feeling grateful for the good things in my life",
        "Had a nice time with friends today",
        "Everything feels okay and manageable",
        "I'm doing well and feeling optimistic",
        "Life is good, no complaints"
    ],
    "Personality disorder": [
        "I feel different from everyone else",
        "My thoughts and behaviors seem unusual to others",
        "I struggle with my sense of identity",
        "My relationships are often unstable",
        "I have trouble understanding social cues",
        "Feel like I don't fit in anywhere",
        "My personality feels fragmented",
        "I behave differently than what's expected",
        "Struggle with consistent self-image",
        "My reactions confuse other people"
    ],
    "Stress": [
        "I'm so stressed with work and deadlines",
        "Feeling overwhelmed by responsibilities",
        "Too much pressure, can't handle it all",
        "Stressed about money and bills",
        "Work is consuming all my energy",
        "Feel like I'm drowning in tasks",
        "The pressure is getting to me",
        "Stressed about exams and performance",
        "Too many things to worry about",
        "Can't cope with all the demands"
    ],
    "Suicidal": [
        "I don't want to exist anymore",
        "Life isn't worth living",
        "I wish I could just disappear",
        "Everything would be better if I wasn't here",
        "I can't see a way forward",
        "The pain is too much to bear",
        "I don't see the point in continuing",
        "Feel like giving up on everything",
        "Can't find a reason to keep going",
        "Nothing will ever get better"
    ]
}


def generate_sample_dataset(num_samples=1000, output_file="sample_training_data.csv"):
    """Generate a sample dataset for training"""
    
    print_header("📊 GENERATING SAMPLE DATASET")
    
    print(f"\n{colored('Configuration:', Colors.BOLD)}")
    print(f"  Total Samples: {colored(str(num_samples), Colors.CYAN)}")
    print(f"  Output File: {colored(output_file, Colors.CYAN)}")
    print(f"  Categories: {colored('7 mental health labels', Colors.CYAN)}")
    
    data = []
    samples_per_category = num_samples // len(SAMPLE_DATA)
    
    print(f"\n{colored('Generating samples...', Colors.BOLD)}")
    
    for category, templates in SAMPLE_DATA.items():
        print(f"  • {colored(category, Colors.YELLOW)}: {samples_per_category} samples")
        
        for i in range(samples_per_category):
            # Pick random template and add variations
            template = random.choice(templates)
            
            # Add some variations to make data more diverse
            variations = [
                template,
                template + " today",
                template + " right now",
                "I feel " + template.lower(),
                "Really " + template.lower(),
                template + " and I don't know what to do",
            ]
            
            text = random.choice(variations)
            data.append({"statement": text, "status": category})
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save
    output_path = Path(output_file)
    df.to_csv(output_path, index=False)
    
    print(f"\n{colored('✅ Dataset generated successfully!', Colors.GREEN)}")
    print(f"\n{colored('Dataset Statistics:', Colors.BOLD)}")
    print(f"  Total Rows: {colored(str(len(df)), Colors.GREEN)}")
    print(f"  Columns: {colored(', '.join(df.columns.tolist()), Colors.GREEN)}")
    
    print(f"\n{colored('Label Distribution:', Colors.BOLD)}")
    label_counts = df['status'].value_counts()
    for label, count in label_counts.items():
        percentage = (count / len(df)) * 100
        print(f"  {label}: {colored(str(count), Colors.CYAN)} ({percentage:.1f}%)")
    
    print(f"\n{colored('Sample Data (first 5 rows):', Colors.BOLD)}")
    print(df.head().to_string(index=False))
    
    print(f"\n{colored('💾 Dataset saved to:', Colors.BOLD)} {colored(str(output_path.absolute()), Colors.GREEN)}")
    
    return df


def view_existing_dataset(csv_file):
    """View statistics of an existing dataset"""
    
    print_header("📋 DATASET ANALYSIS")
    
    try:
        df = pd.read_csv(csv_file)
        
        print(f"\n{colored('Dataset:', Colors.BOLD)} {colored(csv_file, Colors.CYAN)}")
        print(f"\n{colored('Basic Statistics:', Colors.BOLD)}")
        print(f"  Total Rows: {colored(str(len(df)), Colors.GREEN)}")
        print(f"  Columns: {colored(', '.join(df.columns.tolist()), Colors.GREEN)}")
        print(f"  Missing Values: {colored(str(df.isnull().sum().sum()), Colors.YELLOW)}")
        
        # Detect text and label columns
        text_col = None
        label_col = None
        
        for col in df.columns:
            if 'text' in col.lower() or 'statement' in col.lower():
                text_col = col
            if 'label' in col.lower() or 'status' in col.lower():
                label_col = col
        
        if label_col:
            print(f"\n{colored('Label Distribution:', Colors.BOLD)}")
            label_counts = df[label_col].value_counts()
            for label, count in label_counts.items():
                percentage = (count / len(df)) * 100
                print(f"  {label}: {colored(str(count), Colors.CYAN)} ({percentage:.1f}%)")
        
        if text_col:
            print(f"\n{colored('Text Length Statistics:', Colors.BOLD)}")
            lengths = df[text_col].astype(str).str.len()
            print(f"  Mean Length: {colored(f'{lengths.mean():.1f}', Colors.CYAN)} characters")
            print(f"  Min Length: {colored(str(lengths.min()), Colors.CYAN)} characters")
            print(f"  Max Length: {colored(str(lengths.max()), Colors.CYAN)} characters")
        
        print(f"\n{colored('Sample Data (first 10 rows):', Colors.BOLD)}")
        print(df.head(10).to_string(index=False))
        
        print(f"\n{colored('✅ Dataset is ready for training!', Colors.GREEN)}")
        
    except FileNotFoundError:
        print(f"\n{colored('❌ ERROR: File not found!', Colors.RED)}")
        print(f"   {csv_file}")
    except Exception as e:
        print(f"\n{colored(f'❌ ERROR: {str(e)}', Colors.RED)}")


def main():
    """Main function"""
    
    print(colored("\n📊" + "="*78 + "📊", Colors.BOLD))
    print(colored("          DATASET GENERATOR FOR BiLSTM TRAINING", Colors.HEADER + Colors.BOLD))
    print(colored("📊" + "="*78 + "📊", Colors.BOLD))
    
    print(f"\n{colored('Options:', Colors.BOLD)}")
    print(f"  1. Generate new sample dataset")
    print(f"  2. View existing dataset (Combined Data.csv)")
    print(f"  3. View existing dataset (custom file)")
    
    choice = input(f"\n{colored('Enter your choice (1/2/3): ', Colors.CYAN)}")
    
    if choice == '1':
        print()
        num_samples = input(colored("Number of samples to generate (default 1000): ", Colors.CYAN))
        num_samples = int(num_samples) if num_samples.strip() else 1000
        
        output_file = input(colored("Output filename (default: sample_training_data.csv): ", Colors.CYAN))
        output_file = output_file.strip() if output_file.strip() else "sample_training_data.csv"
        
        generate_sample_dataset(num_samples, output_file)
        
        print(f"\n{colored('🎯 You can now train the model using:', Colors.BOLD)}")
        print(f"   {colored('python train_bilstm.py', Colors.YELLOW)}")
        print(f"   (Update the data_csv path in the script to use your new dataset)\n")
        
    elif choice == '2':
        csv_file = "models/sentiment_custom/Combined Data.csv"
        view_existing_dataset(csv_file)
        
    elif choice == '3':
        csv_file = input(colored("\nEnter CSV file path: ", Colors.CYAN))
        view_existing_dataset(csv_file)
        
    else:
        print(f"\n{colored('❌ Invalid choice!', Colors.RED)}\n")


if __name__ == '__main__':
    main()
