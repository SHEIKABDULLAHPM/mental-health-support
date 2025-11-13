"""
BiLSTM Model Training Script
Demonstrates how to train the BiLSTM model with the dataset
"""
import sys
from pathlib import Path

# Add models path
sys.path.insert(0, str(Path(__file__).parent / "models" / "sentiment_custom"))

from keras_lstm import train_keras_lstm, KerasLSTMConfig

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'


def colored(text, color):
    return f"{color}{text}{Colors.END}"


def print_header(text):
    print("\n" + colored("="*80, Colors.BOLD))
    print(colored(f"  {text}", Colors.HEADER + Colors.BOLD))
    print(colored("="*80, Colors.BOLD))


def train_model():
    """Train the BiLSTM model with the Combined Data.csv"""
    
    print_header("🚀 BiLSTM MODEL TRAINING")
    
    print(f"\n{colored('Training Configuration:', Colors.BOLD)}")
    
    # Configuration
    config = KerasLSTMConfig(
        data_csv="models/sentiment_custom/Combined Data.csv",
        text_column="statement",
        label_column="status",
        output_dir="models/sentiment_custom/artifacts/mental_health_lstm",
        max_words=20000,
        max_len=128,
        embedding_dim=128,
        lstm_units=64,
        dropout=0.5,
        epochs=10,
        batch_size=64,
        val_split=0.1,
        patience=3,
        use_nltk=False
    )
    
    print(f"  Dataset: {colored(config.data_csv, Colors.CYAN)}")
    print(f"  Text Column: {colored(config.text_column, Colors.CYAN)}")
    print(f"  Label Column: {colored(config.label_column, Colors.CYAN)}")
    print(f"  Output Directory: {colored(config.output_dir, Colors.CYAN)}")
    print(f"\n  {colored('Model Hyperparameters:', Colors.BOLD)}")
    print(f"  Max Words: {colored(str(config.max_words), Colors.YELLOW)}")
    print(f"  Max Sequence Length: {colored(str(config.max_len), Colors.YELLOW)}")
    print(f"  Embedding Dimension: {colored(str(config.embedding_dim), Colors.YELLOW)}")
    print(f"  LSTM Units: {colored(str(config.lstm_units), Colors.YELLOW)}")
    print(f"  Dropout: {colored(str(config.dropout), Colors.YELLOW)}")
    print(f"  Epochs: {colored(str(config.epochs), Colors.YELLOW)}")
    print(f"  Batch Size: {colored(str(config.batch_size), Colors.YELLOW)}")
    print(f"  Validation Split: {colored(str(config.val_split), Colors.YELLOW)}")
    print(f"  Early Stopping Patience: {colored(str(config.patience), Colors.YELLOW)}")
    
    print(f"\n{colored('⏳ Starting training... This may take 10-30 minutes depending on your hardware.', Colors.YELLOW)}")
    print(f"{colored('   (The model will train on ~94,000 mental health text samples)', Colors.CYAN)}\n")
    
    try:
        # Train the model
        result = train_keras_lstm(config)
        
        print_header("✅ TRAINING COMPLETED SUCCESSFULLY")
        
        # Display results
        test_metrics = result['test']
        accuracy = test_metrics['accuracy'] * 100
        f1_score = test_metrics['f1_macro']
        
        print(f"\n{colored('Model Performance:', Colors.BOLD)}")
        print(f"  Test Accuracy: {colored(f'{accuracy:.2f}%', Colors.GREEN)}")
        print(f"  F1-Score (Macro): {colored(f'{f1_score:.4f}', Colors.GREEN)}")
        
        print(f"\n{colored('Classification Report:', Colors.BOLD)}")
        print(test_metrics['classification_report'])
        
        print(f"\n{colored('Model Artifacts Saved:', Colors.BOLD)}")
        output_dir = result['output_dir']
        print(f"  Location: {colored(output_dir, Colors.CYAN)}")
        print(f"  Files:")
        print(f"    • {colored('model.keras', Colors.YELLOW)} - Trained neural network")
        print(f"    • {colored('tokenizer.json', Colors.YELLOW)} - Text tokenizer")
        print(f"    • {colored('label_encoder.joblib', Colors.YELLOW)} - Label encoder")
        print(f"    • {colored('meta.json', Colors.YELLOW)} - Model metadata & metrics")
        
        print(f"\n{colored('🎉 Model is ready for use!', Colors.GREEN + Colors.BOLD)}")
        print(f"   Run: {colored('python test_bilstm_live.py', Colors.CYAN)} to test the model\n")
        
    except FileNotFoundError as e:
        print(f"\n{colored('❌ ERROR: Dataset not found!', Colors.RED + Colors.BOLD)}")
        print(f"   {str(e)}")
        print(f"   Please ensure 'Combined Data.csv' exists in models/sentiment_custom/\n")
    except Exception as e:
        print(f"\n{colored(f'❌ ERROR: {str(e)}', Colors.RED + Colors.BOLD)}\n")
        import traceback
        traceback.print_exc()


def main():
    """Main training function"""
    
    print(colored("\n🧠" + "="*78 + "🧠", Colors.BOLD))
    print(colored("          BiLSTM DEEP LEARNING MODEL - TRAINING SCRIPT", Colors.HEADER + Colors.BOLD))
    print(colored("🧠" + "="*78 + "🧠", Colors.BOLD))
    
    print(f"\n{colored('⚠️  WARNING:', Colors.YELLOW + Colors.BOLD)}")
    print(f"   This will train a new BiLSTM model from scratch.")
    print(f"   Training time: ~10-30 minutes (depends on hardware)")
    print(f"   This will overwrite existing model artifacts.\n")
    
    response = input(colored("Do you want to continue? (yes/no): ", Colors.CYAN))
    
    if response.lower() in ['yes', 'y']:
        train_model()
    else:
        print(f"\n{colored('❌ Training cancelled.', Colors.YELLOW)}\n")


if __name__ == '__main__':
    main()
