# Google Cloud Run deployment

This repository is ready for one public Cloud Run service. Deployment is a deliberate external action: first authenticate the hackathon account, confirm the exact project ID, and obtain the repository owner's approval for that project.

## 1. Authenticate and select the hackathon project

```bash
gcloud auth login
gcloud projects list
gcloud config set project YOUR_HACKATHON_PROJECT_ID
gcloud config set run/region asia-southeast1
gcloud auth list
gcloud config get-value project
```

Do not continue if either final value points to a personal or unrelated project.

## 2. Enable the small required surface

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Create a Gemini API key through the hackathon's approved Google flow. Never paste it into chat, GitHub, a Docker build argument or a `VITE_*` variable. Store it as a Secret Manager version:

```bash
read -s "GEMINI_API_KEY_VALUE?Gemini API key: "
printf '%s' "$GEMINI_API_KEY_VALUE" | gcloud secrets create gemini-api-key --data-file=-
unset GEMINI_API_KEY_VALUE
```

If the secret already exists, add a version instead:

```bash
read -s "GEMINI_API_KEY_VALUE?Gemini API key: "
printf '%s' "$GEMINI_API_KEY_VALUE" | gcloud secrets versions add gemini-api-key --data-file=-
unset GEMINI_API_KEY_VALUE
```

Create a dedicated runtime identity and grant it access to this one secret only:

```bash
PROJECT_ID="$(gcloud config get-value project)"
gcloud iam service-accounts create windows-87k-run --display-name='87K Windows Cloud Run'
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:windows-87k-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role='roles/secretmanager.secretAccessor'
```

Do not grant project-wide owner/editor roles.

### OpenRouter recovery secret

When the Gemini Developer API is blocked, create a separate OpenRouter secret without printing or committing the key:

```bash
PROJECT_ID="$(gcloud config get-value project)"
read -s "OPENROUTER_API_KEY_VALUE?OpenRouter API key: "
printf '%s' "$OPENROUTER_API_KEY_VALUE" | gcloud secrets create openrouter-api-key --data-file=-
unset OPENROUTER_API_KEY_VALUE
gcloud secrets add-iam-policy-binding openrouter-api-key \
  --member="serviceAccount:windows-87k-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role='roles/secretmanager.secretAccessor'
```

Use `gcloud secrets versions add openrouter-api-key --data-file=-` instead when the secret already exists.

## 3. Deploy one instance

From the repository root:

```bash
PROJECT_ID="$(gcloud config get-value project)"
gcloud run deploy windows-87k \
  --source . \
  --allow-unauthenticated \
  --region asia-southeast1 \
  --min-instances 1 \
  --max-instances 1 \
  --concurrency 40 \
  --timeout 60 \
  --service-account "windows-87k-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars INFERENCE_PROVIDER=gemma-api,GEMMA_MODEL=gemma-4-26b-a4b-it,GEMINI_FACILITATOR=gemini,GEMINI_MODEL=gemini-3.6-flash,ROOM_TTL_MINUTES=120 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

One instance is intentional because rooms live in memory. Minimum one avoids a judging cold start; set it back to zero after the event to stop idle instance cost.

For the OpenRouter recovery deployment, keep the same service and runtime limits but replace the model settings and secret binding:

```bash
gcloud run deploy windows-87k \
  --source . \
  --allow-unauthenticated \
  --region asia-southeast1 \
  --min-instances 1 \
  --max-instances 1 \
  --concurrency 40 \
  --timeout 60 \
  --service-account "windows-87k-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars INFERENCE_PROVIDER=openrouter,OPENROUTER_BASE_URL=https://openrouter.ai/api/v1,OPENROUTER_GEMMA_MODEL=google/gemma-3-27b-it,GEMINI_FACILITATOR=gemini,OPENROUTER_GEMINI_MODEL=google/gemini-3.6-flash,ROOM_TTL_MINUTES=120 \
  --set-secrets OPENROUTER_API_KEY=openrouter-api-key:latest
```

## 4. Verify before sharing

```bash
DEMO_URL="$(gcloud run services describe windows-87k --region asia-southeast1 --format='value(status.url)')"
curl -fsS "$DEMO_URL/health"
CLOUD_RUN_DEMO_URL="$DEMO_URL" ./scripts/verify-demo-machine.sh
```

The OpenRouter health response must show `"status":"ok"`, `"provider":"openrouter"`, `"facilitator":"gemini"`, `"gemmaModel":"google/gemma-3-27b-it"` and `"geminiModel":"google/gemini-3.6-flash"`. Then open `/join/demo87` on a phone and `/wall/demo87` on the projector. Exercise the real extraction and Gemini guide once, then prove the no-match path creates no guide.

## 5. After judging

```bash
gcloud run services update windows-87k --region asia-southeast1 --min-instances 0
```

Review Cloud Billing, then delete the service/secret only when the owner explicitly chooses to. Secrets never enter container layers or the public repository.
