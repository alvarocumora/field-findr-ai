import type { Database, Tables } from './types';

type Assert<T extends true> = T;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type HasTable<K extends string> = K extends keyof Database['public']['Tables'] ? true : false;
type HasFunction<K extends string> = K extends keyof Database['public']['Functions'] ? true : false;

// Compile-time contract for schema features introduced after the last generated snapshot.
// If generated Supabase types drift backwards, `tsc` fails here instead of forcing local
// wrappers and `as any` casts to spread through the application.

type _SalesQuotesTable = Assert<HasTable<'sales_quotes'>>;
type _SalesQuoteEventsTable = Assert<HasTable<'sales_quote_events'>>;
type _CommissionEventsTable = Assert<HasTable<'commission_events'>>;
type _ProjectMembersTable = Assert<HasTable<'project_members'>>;

type ReservationRow = Tables<'reservations'>;
type _ReservationPaymentUrl = Assert<HasKey<ReservationRow, 'payment_url'>>;
type _ReservationPaymentShared = Assert<HasKey<ReservationRow, 'payment_link_shared_at'>>;
type _ReservationSourceQuote = Assert<HasKey<ReservationRow, 'source_quote_id'>>;

type VisitRow = Tables<'visits'>;
type _VisitResultNotes = Assert<HasKey<VisitRow, 'result_notes'>>;
type _VisitNextAction = Assert<HasKey<VisitRow, 'next_action'>>;
type _VisitFollowUp = Assert<HasKey<VisitRow, 'follow_up_at'>>;
type _VisitCompleted = Assert<HasKey<VisitRow, 'completed_at'>>;

type CommissionRow = Tables<'agent_commissions'>;
type _CommissionOriginator = Assert<HasKey<CommissionRow, 'originator_agent_id'>>;
type _CommissionCloser = Assert<HasKey<CommissionRow, 'closing_agent_id'>>;

type SubscriptionRow = Tables<'subscriptions'>;
type PaymentRow = Tables<'payments'>;
type _SubscriptionOrganization = Assert<HasKey<SubscriptionRow, 'organization_id'>>;
type _PaymentOrganization = Assert<HasKey<PaymentRow, 'organization_id'>>;

type _CanAccessProject = Assert<HasFunction<'can_access_project'>>;
type _OrganizationCapability = Assert<HasFunction<'organization_has_capability'>>;
type _OrganizationRole = Assert<HasFunction<'organization_role'>>;
type _PublicSalesQuote = Assert<HasFunction<'get_public_sales_quote'>>;
type _TrackSalesQuote = Assert<HasFunction<'track_sales_quote_view'>>;

export {};
