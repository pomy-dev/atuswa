
import { SupabaseClient } from "@supabase/supabase-js";
import {
  TransferEmailDetails, Affiliate, AffiliateLeadership, AffiliateDocument,
  AffiliateStatus, AffiliateStatusChange, Member
} from "@/lib/types";

// =====================================================
// TYPES
// =====================================================

type Row = Record<string, any>;

type AffiliateStatusHistory = Row;
type AffiliatePayment = Row;
type AffiliateNotification = Row;
type AffiliateLink = Row;
type AffiliateStatusRequest = Row;
type MemberTransferRequest = Row;


// =====================================================
// GENERIC CRUD HELPERS
// =====================================================

async function createRow<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  payload: Partial<T>
): Promise<T> {
  const { data, error } = await (supabase as any)
    .from(table)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as T;
}

async function getRows<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  filters: Row = {},
  orderBy = "created_at",
  ascending = false
): Promise<T[]> {
  let query = (supabase as any).from(table).select("*");

  if (Object.keys(filters).length) {
    query = query.match(filters);
  }

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as T[];
}

async function getRowById<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  id: string | number
): Promise<T> {
  const { data, error } = await (supabase as any)
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as T;
}

async function updateRow<T extends Row>(
  supabase: SupabaseClient,
  table: string,
  id: string | number,
  payload: Partial<T>
): Promise<T> {
  const { data, error } = await (supabase as any)
    .from(table)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as T;
}

async function deleteRow(
  supabase: SupabaseClient,
  table: string,
  id: string | number
): Promise<void> {
  const { error } = await (supabase as any)
    .from(table)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =====================================================
// 1. AFFILIATES
// =====================================================

const AFFILIATES = "affiliates";

export const createAffiliate = (
  supabase: SupabaseClient,
  payload: Partial<Affiliate>
) => createRow<Affiliate>(supabase, AFFILIATES, payload);

export const getAllAffiliates = (
  supabase: SupabaseClient,
  filters: Row = {}
) => getRows<Affiliate>(supabase, AFFILIATES, filters, "created_at");

export const getAffiliateById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<Affiliate>(supabase, AFFILIATES, id);

export const updateAffiliate = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Affiliate>
) => updateRow<Affiliate>(supabase, AFFILIATES, id, payload);

export const deleteAffiliate = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, AFFILIATES, id);

// =====================================================
// 2. AFFILIATE LEADERSHIP
// =====================================================

const LEADERSHIP = "affiliate_leadership";

export const createAffiliateLeadership = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateLeadership>
) => createRow<AffiliateLeadership>(supabase, LEADERSHIP, payload);

export const getAffiliateLeadership = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliateLeadership>(
  supabase, LEADERSHIP, { affiliate_id: affiliateId }, "id", true
);

export const updateAffiliateLeadership = (
  supabase: SupabaseClient,
  id: number,
  payload: Partial<AffiliateLeadership>
) => updateRow<AffiliateLeadership>(supabase, LEADERSHIP, id, payload);

export const deleteAffiliateLeadership = (
  supabase: SupabaseClient,
  id: number
) => deleteRow(supabase, LEADERSHIP, id);

// =====================================================
// 3. AFFILIATE STATUS HISTORY
// =====================================================

const STATUS_HISTORY = "affiliate_status_history";

export const createAffiliateStatusHistory = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateStatusHistory>
) => createRow<AffiliateStatusHistory>(supabase, STATUS_HISTORY, payload);

export const getAffiliateStatusHistory = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliateStatusHistory>(
  supabase, STATUS_HISTORY, { affiliate_id: affiliateId }, "changed_at"
);

export const deleteAffiliateStatusHistory = (
  supabase: SupabaseClient,
  id: number
) => deleteRow(supabase, STATUS_HISTORY, id);

// =====================================================
// 4. AFFILIATE DOCUMENTS
// =====================================================

const DOCUMENTS = "affiliate_documents";

export const createAffiliateDocument = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateDocument>
) => createRow<AffiliateDocument>(supabase, DOCUMENTS, payload);

export async function uploadAffiliateDocument(
  supabase: SupabaseClient,
  affiliateId: string,
  file: File
): Promise<AffiliateDocument> {
  const bucket = "affiliate-files";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${affiliateId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  try {
    return await createAffiliateDocument(supabase, {
      affiliate_id: affiliateId,
      name: file.name,
      category: "Other",
      url: data.publicUrl,
    } as Partial<AffiliateDocument>);
  } catch (error) {
    await supabase.storage.from(bucket).remove([path]);
    throw error;
  }
}

export const getAffiliateDocuments = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliateDocument>(
  supabase, DOCUMENTS, { affiliate_id: affiliateId }, "uploaded_at"
);

export const getAffiliateDocumentById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<AffiliateDocument>(supabase, DOCUMENTS, id);

export const updateAffiliateDocument = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<AffiliateDocument>
) => updateRow<AffiliateDocument>(supabase, DOCUMENTS, id, payload);

export async function deleteAffiliateDocument(
  supabase: SupabaseClient,
  id: string
) {
  const document = await getAffiliateDocumentById(supabase, id);
  const publicPrefix = '/storage/v1/object/public/affiliate-files/';
  if (document.url?.includes(publicPrefix)) {
    const path = decodeURIComponent(document.url.split(publicPrefix)[1].split('?')[0]);
    const { error } = await supabase.storage.from('affiliate-files').remove([path]);
    if (error) throw error;
  }
  await deleteRow(supabase, DOCUMENTS, id);
}

// =====================================================
// 5. MEMBERS
// =====================================================

const MEMBERS = "members";

export const createMember = (
  supabase: SupabaseClient,
  payload: Partial<Member>
) => createRow<Member>(supabase, MEMBERS, payload);

export const getAllMembers = (
  supabase: SupabaseClient,
  filters: Row = {}
) => getRows<Member>(supabase, MEMBERS, filters, "created_at");

export const getMemberById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<Member>(supabase, MEMBERS, id);

export const getMembersByAffiliate = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<Member>(
  supabase, MEMBERS, { affiliate_id: affiliateId }, "created_at"
);

export const getMembersByBranch = (
  supabase: SupabaseClient,
  branchId: string
) => getRows<Member>(
  supabase, MEMBERS, { branch_id: branchId }, "created_at"
);

export const updateMember = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Member>
) => updateRow<Member>(supabase, MEMBERS, id, payload);

export const deleteMember = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, MEMBERS, id);

// =====================================================
// 6. AFFILIATE PAYMENTS
// =====================================================

const PAYMENTS = "affiliate_payments";

export const createAffiliatePayment = (
  supabase: SupabaseClient,
  payload: Partial<AffiliatePayment>
) => createRow<AffiliatePayment>(supabase, PAYMENTS, payload);

export const getAffiliatePayments = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliatePayment>(
  supabase, PAYMENTS, { affiliate_id: affiliateId }, "recorded_at"
);

export const getAffiliatePaymentById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<AffiliatePayment>(supabase, PAYMENTS, id);

export const updateAffiliatePayment = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<AffiliatePayment>
) => updateRow<AffiliatePayment>(supabase, PAYMENTS, id, payload);

export const deleteAffiliatePayment = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, PAYMENTS, id);

// =====================================================
// 7. AFFILIATE NOTIFICATIONS
// =====================================================

const NOTIFICATIONS = "affiliate_notifications";

export const createAffiliateNotification = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateNotification>
) => createRow<AffiliateNotification>(supabase, NOTIFICATIONS, payload);

export const getAffiliateNotifications = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliateNotification>(
  supabase, NOTIFICATIONS, { affiliate_id: affiliateId }, "queued_at"
);

export const updateAffiliateNotification = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<AffiliateNotification>
) => updateRow<AffiliateNotification>(supabase, NOTIFICATIONS, id, payload);

export const deleteAffiliateNotification = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, NOTIFICATIONS, id);

// =====================================================
// 8. AFFILIATE LINKS
// =====================================================

const LINKS = "affiliate_links";

export const createAffiliateLink = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateLink>
) => createRow<AffiliateLink>(supabase, LINKS, payload);

export const getAffiliateLinks = (
  supabase: SupabaseClient,
  affiliateId: string
) => getRows<AffiliateLink>(
  supabase, LINKS, { affiliate_id: affiliateId }, "linked_at"
);

export const updateAffiliateLink = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<AffiliateLink>
) => updateRow<AffiliateLink>(supabase, LINKS, id, payload);

export const deleteAffiliateLink = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, LINKS, id);

// =====================================================
// 9. AFFILIATE STATUS REQUESTS
// =====================================================

const STATUS_REQUESTS = "affiliate_status_requests";

export const createAffiliateStatusRequest = (
  supabase: SupabaseClient,
  payload: Partial<AffiliateStatusRequest>
) => createRow<AffiliateStatusRequest>(
  supabase, STATUS_REQUESTS, payload
);

export const getAffiliateStatusRequests = (
  supabase: SupabaseClient,
  filters: Row = {}
) => getRows<AffiliateStatusRequest>(
  supabase, STATUS_REQUESTS, filters, "requested_at"
);

export const getAffiliateStatusRequestById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<AffiliateStatusRequest>(
  supabase, STATUS_REQUESTS, id
);

export const updateAffiliateStatusRequest = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<AffiliateStatusRequest>
) => updateRow<AffiliateStatusRequest>(
  supabase, STATUS_REQUESTS, id, payload
);

export const deleteAffiliateStatusRequest = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, STATUS_REQUESTS, id);

// =====================================================
// 10. MEMBER TRANSFER REQUESTS
// =====================================================

const TRANSFERS = "member_transfer_requests";

export const createMemberTransferRequest = (
  supabase: SupabaseClient,
  payload: Partial<MemberTransferRequest>
) => createRow<MemberTransferRequest>(
  supabase, TRANSFERS, payload
);

export const getMemberTransferRequests = (
  supabase: SupabaseClient,
  filters: Row = {}
) => getRows<MemberTransferRequest>(
  supabase, TRANSFERS, filters, "requested_at"
);

export const getMemberTransferRequestById = (
  supabase: SupabaseClient,
  id: string
) => getRowById<MemberTransferRequest>(
  supabase, TRANSFERS, id
);

export const updateMemberTransferRequest = (
  supabase: SupabaseClient,
  id: string,
  payload: Partial<MemberTransferRequest>
) => updateRow<MemberTransferRequest>(
  supabase, TRANSFERS, id, payload
);

export const deleteMemberTransferRequest = (
  supabase: SupabaseClient,
  id: string
) => deleteRow(supabase, TRANSFERS, id);

// =====================================================
// APPROVE MEMBER TRANSFER + SEND EMAIL
// =====================================================

export async function approveMemberTransfer(
  supabase: SupabaseClient,
  requestId: string,
  reviewedBy: string,
  emailDetails: TransferEmailDetails = {}
) {
  // 1. Get transfer request
  const request = await getMemberTransferRequestById(
    supabase, requestId
  );

  if (request.status !== "Pending") {
    throw new Error("This transfer request has already been processed.");
  }

  // 2. Get member
  const member = await getMemberById(
    supabase, request.member_id
  );

  if (!member.email) {
    throw new Error("The member does not have an email address.");
  }

  // 3. Save original member details for rollback
  const previousDetails = {
    branch_id: member.branch_id,
    affiliate_id: member.affiliate_id
  };

  // 4. Update member's branch and affiliate
  const memberUpdates: Row = {};

  if (request.to_branch_id !== null) {
    memberUpdates.branch_id = request.to_branch_id;
  }

  if (request.to_affiliate_id !== null) {
    memberUpdates.affiliate_id = request.to_affiliate_id;
  }

  let updatedMember: Member;

  try {
    updatedMember = await updateMember(
      supabase,
      member.id,
      memberUpdates
    );

    // 5. Mark request as approved
    await updateMemberTransferRequest(
      supabase,
      requestId,
      {
        status: "Approved",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      }
    );
  } catch (error) {
    // Attempt to restore member's previous assignment
    if (Object.keys(memberUpdates).length) {
      await updateMember(
        supabase,
        member.id,
        previousDetails
      ).catch((rollbackError) => {
        console.error("Transfer rollback failed:", rollbackError);
      });
    }

    throw error;
  }

  // 6. Send notification email AFTER transfer approval
  const { data: emailData, error: emailError } =
    await supabase.functions.invoke(
      "send-member-transfer-email",
      {
        body: {
          requestId,
          ...emailDetails
        }
      }
    );

  return {
    success: true,
    transfer: {
      requestId,
      member: updatedMember,
      status: "Approved"
    },
    emailSent: !emailError && emailData?.success === true,
    emailError: emailError?.message ?? (
      emailData?.success === true
        ? null
        : emailData?.error ?? "Email delivery was not confirmed."
    )
  };
}

// =====================================================
// REJECT MEMBER TRANSFER
// =====================================================

export async function rejectMemberTransfer(
  supabase: SupabaseClient,
  requestId: string,
  reviewedBy: string
) {
  const request = await getMemberTransferRequestById(
    supabase, requestId
  );

  if (request.status !== "Pending") {
    throw new Error("This transfer request has already been processed.");
  }

  return updateMemberTransferRequest(
    supabase,
    requestId,
    {
      status: "Rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString()
    }
  );
}
