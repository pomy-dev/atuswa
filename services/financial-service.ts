
import { SupabaseClient } from "@supabase/supabase-js";
import {
  FinancialRecordInput, FinancialRecordPayload, FinancialPayment, FinancialPaymentInput, FinancialRecordFilters
} from "@/lib/types";

// ==========================================
// FINANCIAL RECORDS
// ==========================================

// Get all financial records with optional filters
export async function getFinancialRecords(
  supabase: SupabaseClient,
  filters: FinancialRecordFilters = {}
): Promise<FinancialRecordPayload[]> {
  let query = supabase
    .from("financial_records")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (filters.branch_id) {
    query = query.eq("branch_id", filters.branch_id);
  }

  if (filters.affiliate_id) {
    query = query.eq("affiliate_id", filters.affiliate_id);
  }

  if (filters.member_id) {
    query = query.eq("member_id", filters.member_id);
  }

  if (filters.transaction_type) {
    query = query.eq("transaction_type", filters.transaction_type);
  }

  if (filters.start_date) {
    query = query.gte("transaction_date", filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte("transaction_date", filters.end_date);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map(fromFinancialRecordRow);
}

// Get financial record by ID
export async function getFinancialRecordById(
  supabase: SupabaseClient,
  id: string
): Promise<FinancialRecordPayload> {
  const { data, error } = await supabase
    .from("financial_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return fromFinancialRecordRow(data);
}

// Get records by branch
export async function getFinancialRecordsByBranch(
  supabase: SupabaseClient,
  branchId: string
): Promise<FinancialRecordPayload[]> {
  return getFinancialRecords(supabase, { branch_id: branchId });
}

// Get records by affiliate
export async function getFinancialRecordsByAffiliate(
  supabase: SupabaseClient,
  affiliateId: string
): Promise<FinancialRecordPayload[]> {
  return getFinancialRecords(supabase, { affiliate_id: affiliateId });
}

export async function createFinancialRecord(
  supabase: SupabaseClient,
  payload: FinancialRecordInput,
  userId?: string
): Promise<FinancialRecordPayload> {
  const receiptPath = payload.evidence_file
    ? await uploadFinancialReceipt(supabase, payload.evidence_file)
    : undefined;
  const row = toFinancialRecordRow(payload, userId);
  if (receiptPath) row.receipt_url = receiptPath;

  const { data, error } = await supabase
    .from("financial_records")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (receiptPath) {
      await supabase.storage.from("financial").remove([receiptPath]);
    }
    throw error;
  }

  return fromFinancialRecordRow(data);
}

function toFinancialRecordRow(payload: Partial<FinancialRecordInput>, userId?: string) {
  const type = payload.type;
  const value = (payload.category ?? '').trim().toLowerCase();
  const incomeSources: Record<string, string> = {
    'member dues': 'subscription',
    'grants': 'grant',
    'salaries': 'salary',
    'donations': 'other',
    'events revenue': 'other',
    'sponsorships': 'other',
    'other income': 'other',
  };
  const expenseCategories: Record<string, string> = {
    'office supplies': 'other',
    'events': 'other',
    'legal & professional': 'other',
    'other expenses': 'other',
    'salaries': 'other',
  };
  const row: Record<string, unknown> = {};

  if (payload.id) row.id = payload.id;
  if (payload.branch_id !== undefined) row.branch_id = payload.branch_id;
  if (payload.affiliate_id !== undefined) row.affiliate_id = payload.affiliate_id;
  if (payload.member_id !== undefined) row.member_id = payload.member_id;
  if (type !== undefined) row.transaction_type = type;
  if (payload.amount !== undefined) row.amount = payload.amount;
  if (payload.category !== undefined || type !== undefined) {
    row.source = type === 'income' ? (incomeSources[value] ?? 'other') : null;
    row.category = type === 'expense' ? (expenseCategories[value] ?? value) : null;
  }
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.date !== undefined) row.transaction_date = new Date(payload.date).toISOString().slice(0, 10);
  if (userId !== undefined || payload.created_by !== undefined) row.created_by = userId ?? payload.created_by;

  return row;
}

function fromFinancialRecordRow(row: any): FinancialRecordPayload {
  return {
    id: row.id,
    type: row.transaction_type,
    amount: Number(row.amount),
    category: row.category ?? row.source ?? '',
    source: row.source ?? undefined,
    description: row.description ?? '',
    date: new Date(row.transaction_date),
    branch_id: row.branch_id ?? undefined,
    affiliate_id: row.affiliate_id ?? undefined,
    member_id: row.member_id ?? undefined,
    created_by: row.created_by ?? '',
    receipt_url: row.receipt_url ?? undefined,
  };
}

// Update financial record
export async function updateFinancialRecord(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<FinancialRecordPayload>
): Promise<FinancialRecordPayload> {
  const { data, error } = await supabase
    .from("financial_records")
    .update(toFinancialRecordRow(payload))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return fromFinancialRecordRow(data);
}

// Delete financial record
export async function deleteFinancialRecord(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data: record, error: lookupError } = await supabase
    .from("financial_records")
    .select("receipt_url")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const { error } = await supabase
    .from("financial_records")
    .delete()
    .eq("id", id);

  if (error) throw error;

  if (record?.receipt_url) {
    const { error: storageError } = await supabase.storage
      .from("financial")
      .remove([record.receipt_url]);
    if (storageError) console.error("Unable to remove financial receipt:", storageError);
  }
}

// ==========================================
// FINANCIAL PAYMENTS
// ==========================================

// Get all payments
export async function getFinancialPayments(
  supabase: SupabaseClient,
): Promise<FinancialPayment[]> {
  const { data, error } = await supabase
    .from("financial_payments")
    .select("*")
    .order("payment_date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as FinancialPayment[];
}

// Get payments by financial record
export async function getPaymentsByFinancialRecord(
  supabase: SupabaseClient,
  recordId: string
): Promise<FinancialPayment[]> {
  const { data, error } = await supabase
    .from("financial_payments")
    .select("*")
    .eq("financial_record_id", recordId)
    .order("payment_date", { ascending: false });

  if (error) throw error;

  return (data ?? []) as FinancialPayment[];
}

// Get individual payment
export async function getFinancialPaymentById(
  supabase: SupabaseClient,
  id: string
): Promise<FinancialPayment> {
  const { data, error } = await supabase
    .from("financial_payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as FinancialPayment;
}

// Record a payment
export async function createFinancialPayment(
  supabase: SupabaseClient,
  payload: FinancialPaymentInput,
  userId?: string
): Promise<FinancialPayment> {
  const { data, error } = await supabase
    .from("financial_payments")
    .insert({
      ...payload,
      received_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data as FinancialPayment;
}

// Update payment
export async function updateFinancialPayment(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<FinancialPaymentInput>
): Promise<FinancialPayment> {
  const { data, error } = await supabase
    .from("financial_payments")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as FinancialPayment;
}

// Delete payment
export async function deleteFinancialPayment(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("financial_payments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadFinancialReceipt(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const filePath = `receipts/${fileName}`;

  const { error } = await supabase.storage
    .from("financial")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  return filePath;
}

export async function getFinancialReceiptUrl(
  supabase: SupabaseClient,
  receiptPath: string
): Promise<string> {

  const { data, error } = await supabase.storage
    .from("financial")
    .createSignedUrl(receiptPath, 3600);

  if (error) throw error;

  return data.signedUrl;
}