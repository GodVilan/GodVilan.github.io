# Multimodal Emotion Recognition (MELD) — Cross-Modal Transformers

## One-line
A cross-modal Transformer that fuses text, audio, and video to classify emotions in multi-party
dialogue, for 7-class conversational emotion recognition on the MELD dataset.

## What it does
Projects modality-specific features into a shared embedding space and uses a **4-layer, 8-head
Transformer fusion encoder** to learn inter-modality correlations — for example, weighing a spoken
word against a vocal tone or a micro-expression. The fused representation is mean-pooled and
passed through an MLP classifier (dropout 0.3). Foundation encoders: BERT (`bert-base-uncased`)
for text, Wav2Vec2 (`facebook/wav2vec2-base`) for audio, ViT
(`google/vit-base-patch16-224`) for video frames.

## Key metrics (verified)
- **Accuracy: 59.96%**
- **Weighted F1: 60.66%**
- **Macro F1: 44.72%**

on the unseen MELD test set after 5 epochs of staged fine-tuning across 7 emotion classes.

## Engineering highlights
- Mixed-precision (AMP) training via `torch.amp.GradScaler`.
- Staged fine-tuning: a 2-epoch encoder freeze warms up the fusion head, then full-model unfreeze
  refines the backbones without catastrophic forgetting.
- Cached tensor preprocessing (serialized `.pt` files) to remove data-loading bottlenecks.
- Class-weighted cross-entropy loss to handle minority emotions (e.g. Disgust, Fear).

## Stack
PyTorch, HuggingFace Transformers, BERT, Wav2Vec2, ViT, OpenCV/Librosa for media extraction.

## Links
- GitHub: https://github.com/GodVilan/Multimodal-Emotion-Recognition-MELD-via-Cross-Modal-Transformers
