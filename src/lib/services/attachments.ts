import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';
import type { CardAttachment } from '$lib/types';
import { MAX_ATTACHMENT_BYTES, MINDRE_BUCKET } from '$lib/supabase/constants';
import { mapAttachment } from './mappers';

function safeFilename(filename: string): string {
  const cleaned = filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
  return cleaned || 'attachment';
}

export async function uploadAttachment(
  client: SupabaseClient<Database>,
  userId: string,
  deckId: string,
  cardId: string,
  file: File,
  previous: CardAttachment | null
): Promise<CardAttachment> {
  if (file.size <= 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('Attachments must be 10 MB or smaller.');

  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/${deckId}/${fileId}-${safeFilename(file.name)}`;
  const { error: uploadError } = await client.storage
    .from(MINDRE_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (uploadError) throw uploadError;

  const metadata = {
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size
  };

  const result = previous
    ? await client.from('card_attachments').update(metadata).eq('id', previous.id).select('*').single()
    : await client.from('card_attachments').insert({
        ...metadata,
        card_id: cardId,
        user_id: userId
      }).select('*').single();

  const { data, error: metadataError } = result;
  if (metadataError) {
    await client.storage.from(MINDRE_BUCKET).remove([storagePath]);
    throw metadataError;
  }

  if (previous && previous.storagePath !== storagePath) {
    const { error: cleanupError } = await client.storage
      .from(MINDRE_BUCKET)
      .remove([previous.storagePath]);
    if (cleanupError) console.warn('Could not remove previous attachment:', cleanupError.message);
  }

  return mapAttachment(data);
}

export async function removeAttachment(
  client: SupabaseClient<Database>,
  attachment: CardAttachment
): Promise<void> {
  const { error: storageError } = await client.storage
    .from(MINDRE_BUCKET)
    .remove([attachment.storagePath]);
  if (storageError) throw storageError;

  const { error } = await client.from('card_attachments').delete().eq('id', attachment.id);
  if (error) throw error;
}

export async function downloadAttachment(
  client: SupabaseClient<Database>,
  attachment: CardAttachment
): Promise<void> {
  const { data, error } = await client.storage.from(MINDRE_BUCKET).download(attachment.storagePath);
  if (error) throw error;

  const url = URL.createObjectURL(data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = attachment.originalFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
