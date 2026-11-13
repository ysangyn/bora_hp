# To ChatGPT: image production brief for 보라다방 (Bora Dabang)

You are asked to produce 17 images for a small web room called 보라다방. Work through this brief yourself, in order, without asking the user to paste each prompt. Reply to the user in Korean.

Full prompts are in `ORDER.md` in this same branch:
https://github.com/ysangyn/bora_hp/blob/img-lab/ORDER.md
(raw: https://raw.githubusercontent.com/ysangyn/bora_hp/img-lab/ORDER.md)

## Rules

1. Use each English prompt in `ORDER.md` exactly as written. Do not restyle, do not add text, logos or extra objects.
2. Output the size given, or the nearest size your generator produces (for example 1254×1254 instead of 1024×1024 is fine). Never upscale and do not resize yourself; Claude downscales.
3. "Transparent background" items must be real PNG with alpha. For "seamless tileable" items, aim for wrapping edges, but a near miss is fine: Claude repairs seams. Near-#00FF00 green is also fine: Claude keys it.
4. One image per item. Name each file by its order code: `R1.png`, `R2.png`, `R3.png`, `B2.png`, `B3.png`, `K1.png`, `K2.png`, `K3.png`, `V1.png`, `V2.png`, `V3.png`, `V4.png`, `P1.png` … `P5.png`.
5. After each batch, list the files with their pixel sizes and give the user download links (a single zip if you can make one).
6. If an item fails or you are unsure, skip it, continue, and report it at the end. Do not substitute a different picture.

## Order of work

**Batch 1 (do first, then stop and wait):** R1 → R2 → R3 → B2 → B3

- R1, R2, R3 are EDITS of a reference photo, not new pictures. Reference:
  https://raw.githubusercontent.com/ysangyn/bora_hp/img-lab/ref_window_on.png (1536×1024)
  If you cannot load this image yourself, ask the user once to attach `ref_window_on.png`, then continue.
- R2 and R3 must match your own R1 result (same blind fabric, chain and light). Use R1 as the second reference.
- Keep framing identical to the reference in R1–R3: no crop, no shift, no resize. The glass must be flat pure green #00FF00 where the prompt says so.

**Batch 2 (after the user says go):** K1, K2, K3, V1, V2, V3, V4

**Batch 3 (after the user says go):** P1, P2, P3, P4, P5 — append the shared closing sentence from `ORDER.md` to each prompt (P4 is the one exception noted there).

## Context (for judgment only)

The room is a quiet, warm 1970s-style music room at night: plum walls, dark walnut furniture, one lamp on the right. See `audit_room.jpg` in this branch. Everything should look like a real photograph that belongs in that room. No medical or wellness claims, no text in images.

## Status

Batches 1–4 are accepted (see `FEEDBACK.md`). **Batch 5 (W1–W6) is new: do it now when the user says go.** It is at the end of `ORDER.md`. Each item is an EDIT that takes two attached images from this branch (`ref_window_off.png` or `ref_window_day.png` as the first, and `ref_R1_on.png` / `ref_R2_on.png` / `ref_R3_on.png` as the second); ask the user to attach them if you cannot load them. Keep framing identical; 1536×1024; name files `W1.png` … `W6.png`. Stop after W6.

## What happens next

The user uploads your files to `inbox/` in this branch. Claude then crops, color-matches and fits them into the page and may write follow-up requests in `FEEDBACK.md` here.
