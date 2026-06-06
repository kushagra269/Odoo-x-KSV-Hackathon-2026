const bcrypt = require('bcryptjs');

const ids = {
  users: {
    admin: '11111111-1111-4111-8111-111111111111',
    officer: '22222222-2222-4222-8222-222222222222',
    rahul: '33333333-3333-4333-8333-333333333333',
    priya: '44444444-4444-4444-8444-444444444444',
  },
  vendors: {
    infra: '55555555-5555-4555-8555-555555555555',
    tech: '66666666-6666-4666-8666-666666666666',
    fastlog: '77777777-7777-4777-8777-777777777777',
    office: '88888888-8888-4888-8888-888888888888',
    pending: '99999999-9999-4999-8999-999999999999',
  },
  rfqs: {
    furniture: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    laptops: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  },
  rfqItems: {
    chairs: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    desks: 'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa',
    cabinets: 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa',
    laptops: 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb',
    monitors: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
  },
  quotations: {
    infra: 'cccccccc-1111-4111-8111-cccccccccccc',
    tech: 'cccccccc-2222-4222-8222-cccccccccccc',
    office: 'cccccccc-3333-4333-8333-cccccccccccc',
  },
  approvals: {
    inProgress: 'dddddddd-1111-4111-8111-dddddddddddd',
    completed: 'dddddddd-2222-4222-8222-dddddddddddd',
  },
  po: 'eeeeeeee-1111-4111-8111-eeeeeeeeeeee',
  invoice: 'ffffffff-1111-4111-8111-ffffffffffff',
};

const now = new Date('2026-06-06T09:00:00.000Z');
const yesterday = new Date('2026-06-05T09:00:00.000Z');
const lastWeek = new Date('2026-05-29T09:00:00.000Z');
const nextMonth = new Date('2026-07-06T00:00:00.000Z');

function money(value) {
  return Number(value).toFixed(2);
}

function quoteLine(id, quotationId, rfqLineItemId, itemName, quantity, unitPrice, deliveryDays) {
  const total = Number(quantity) * Number(unitPrice);
  return {
    id,
    quotation_id: quotationId,
    rfq_line_item_id: rfqLineItemId,
    item_name: itemName,
    quantity: money(quantity),
    unit_price: money(unitPrice),
    total_price: money(total),
    delivery_days: deliveryDays,
  };
}

exports.seed = async function seed(knex) {
  await knex.transaction(async (trx) => {
    await trx('activity_logs').del();
    await trx('invoices').del();
    await trx('purchase_orders').del();
    await trx('approval_steps').del();
    await trx('approvals').del();
    await trx('quotation_line_items').del();
    await trx('quotations').del();
    await trx('rfq_attachments').del();
    await trx('rfq_vendor_assignments').del();
    await trx('rfq_line_items').del();
    await trx('rfqs').del();
    await trx('vendors').del();
    await trx('users').del();

    const [adminHash, officerHash, managerHash] = await Promise.all([
      bcrypt.hash('Admin@123', 12),
      bcrypt.hash('Officer@123', 12),
      bcrypt.hash('Manager@123', 12),
    ]);

    await trx('users').insert([
      {
        id: ids.users.admin,
        first_name: 'Aarav',
        last_name: 'Shah',
        email: 'admin@vendorbridge.com',
        password_hash: adminHash,
        phone: '+91 98765 00001',
        country: 'India',
        role: 'admin',
        additional_info: 'System administrator',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.users.officer,
        first_name: 'Harshal',
        last_name: 'Patel',
        email: 'harshal@vendorbridge.com',
        password_hash: officerHash,
        phone: '+91 98765 00002',
        country: 'India',
        role: 'procurement_officer',
        additional_info: 'Procurement operations',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.users.rahul,
        first_name: 'Rahul',
        last_name: 'Mehta',
        email: 'rahul@vendorbridge.com',
        password_hash: managerHash,
        phone: '+91 98765 00003',
        country: 'India',
        role: 'manager',
        additional_info: 'L1 procurement reviewer',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.users.priya,
        first_name: 'Priya',
        last_name: 'Shah',
        email: 'priya@vendorbridge.com',
        password_hash: managerHash,
        phone: '+91 98765 00004',
        country: 'India',
        role: 'manager',
        additional_info: 'L2 procurement approver',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await trx('vendors').insert([
      {
        id: ids.vendors.infra,
        vendor_name: 'Infra Supplies Pvt Ltd',
        category: 'Office Furniture',
        gst_number: '27AABCI1234F1Z5',
        contact_name: 'Nikhil Rao',
        contact_number: '+91 99887 10001',
        email: 'infra@supplies.com',
        address: 'Plot 18, Andheri Industrial Estate, Mumbai',
        country: 'India',
        status: 'active',
        rating: '4.6',
        notes: 'Reliable furniture and facility supplies partner.',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.vendors.tech,
        vendor_name: 'Tech Core LTD',
        category: 'IT Hardware',
        gst_number: '29AABCT2345G1Z2',
        contact_name: 'Meera Iyer',
        contact_number: '+91 99887 10002',
        email: 'sales@techcore.example',
        address: '42 Residency Road, Bengaluru',
        country: 'India',
        status: 'active',
        rating: '4.3',
        notes: 'Strong SLA for hardware procurement.',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.vendors.fastlog,
        vendor_name: 'FastLog Transport',
        category: 'Logistics',
        gst_number: '24AABCF3456H1Z8',
        contact_name: 'Arjun Desai',
        contact_number: '+91 99887 10003',
        email: 'ops@fastlog.example',
        address: 'NH48 Logistics Park, Ahmedabad',
        country: 'India',
        status: 'active',
        rating: '4.1',
        notes: 'Pan-India delivery coverage.',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.vendors.office,
        vendor_name: 'OfficeNeed Co.',
        category: 'Office Furniture',
        gst_number: '07AABCO4567J1Z4',
        contact_name: 'Kavita Menon',
        contact_number: '+91 99887 10004',
        email: 'quotes@officeneed.example',
        address: 'Connaught Place, New Delhi',
        country: 'India',
        status: 'active',
        rating: '4.8',
        notes: 'Competitive pricing on bulk office items.',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
      {
        id: ids.vendors.pending,
        vendor_name: 'GreenBuild Associates',
        category: 'Facilities',
        gst_number: '33AABCG5678K1Z7',
        contact_name: 'Sanjay Kumar',
        contact_number: '+91 99887 10005',
        email: 'hello@greenbuild.example',
        address: 'OMR Business Park, Chennai',
        country: 'India',
        status: 'pending',
        rating: '0.0',
        notes: 'Pending compliance verification.',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
    ]);

    await trx('rfqs').insert([
      {
        id: ids.rfqs.furniture,
        rfq_number: 'RFQ-2026-0001',
        title: 'Office Furniture Q2',
        category: 'Office Furniture',
        description: 'Bulk procurement for ergonomic seating, work desks, and storage cabinets for the Q2 office expansion.',
        deadline: '2026-06-25',
        status: 'published',
        created_by: ids.users.officer,
        created_at: lastWeek,
        updated_at: now,
      },
      {
        id: ids.rfqs.laptops,
        rfq_number: 'RFQ-2026-0002',
        title: 'Engineering Laptop Refresh',
        category: 'IT Hardware',
        description: 'Draft RFQ for laptops and external monitors for the engineering team.',
        deadline: '2026-07-15',
        status: 'draft',
        created_by: ids.users.officer,
        created_at: now,
        updated_at: now,
      },
    ]);

    await trx('rfq_line_items').insert([
      { id: ids.rfqItems.chairs, rfq_id: ids.rfqs.furniture, item_name: 'Ergonomic Chairs', quantity: '100.00', unit: 'pcs', created_at: lastWeek },
      { id: ids.rfqItems.desks, rfq_id: ids.rfqs.furniture, item_name: 'Standing Desks', quantity: '50.00', unit: 'pcs', created_at: lastWeek },
      { id: ids.rfqItems.cabinets, rfq_id: ids.rfqs.furniture, item_name: 'Storage Cabinets', quantity: '25.00', unit: 'pcs', created_at: lastWeek },
      { id: ids.rfqItems.laptops, rfq_id: ids.rfqs.laptops, item_name: 'Developer Laptops', quantity: '30.00', unit: 'pcs', created_at: now },
      { id: ids.rfqItems.monitors, rfq_id: ids.rfqs.laptops, item_name: '27 inch Monitors', quantity: '30.00', unit: 'pcs', created_at: now },
    ]);

    await trx('rfq_vendor_assignments').insert([
      { id: '12121212-1111-4111-8111-121212121212', rfq_id: ids.rfqs.furniture, vendor_id: ids.vendors.infra, invited_at: lastWeek, status: 'submitted' },
      { id: '12121212-2222-4222-8222-121212121212', rfq_id: ids.rfqs.furniture, vendor_id: ids.vendors.tech, invited_at: lastWeek, status: 'submitted' },
      { id: '12121212-3333-4333-8333-121212121212', rfq_id: ids.rfqs.furniture, vendor_id: ids.vendors.office, invited_at: lastWeek, status: 'submitted' },
      { id: '12121212-4444-4444-8444-121212121212', rfq_id: ids.rfqs.laptops, vendor_id: ids.vendors.tech, invited_at: now, status: 'invited' },
      { id: '12121212-5555-4555-8555-121212121212', rfq_id: ids.rfqs.laptops, vendor_id: ids.vendors.infra, invited_at: now, status: 'invited' },
    ]);

    await trx('rfq_attachments').insert([
      {
        id: '23232323-1111-4111-8111-232323232323',
        rfq_id: ids.rfqs.furniture,
        file_name: 'office-furniture-specification.pdf',
        file_url: '/uploads/rfqs/office-furniture-specification.pdf',
        uploaded_at: lastWeek,
      },
    ]);

    await trx('quotations').insert([
      {
        id: ids.quotations.infra,
        quotation_number: 'QT-2026-0001',
        rfq_id: ids.rfqs.furniture,
        vendor_id: ids.vendors.infra,
        subtotal: '224000.00',
        gst_percentage: '18.00',
        gst_amount: '40320.00',
        grand_total: '264320.00',
        payment_terms: '50% advance, balance on delivery',
        notes: 'Delivery in three batches with installation support.',
        status: 'selected',
        submitted_at: yesterday,
        created_at: yesterday,
        updated_at: now,
      },
      {
        id: ids.quotations.tech,
        quotation_number: 'QT-2026-0002',
        rfq_id: ids.rfqs.furniture,
        vendor_id: ids.vendors.tech,
        subtotal: '232500.00',
        gst_percentage: '18.00',
        gst_amount: '41850.00',
        grand_total: '274350.00',
        payment_terms: 'Net 30',
        notes: 'Includes two-year service support.',
        status: 'submitted',
        submitted_at: yesterday,
        created_at: yesterday,
        updated_at: yesterday,
      },
      {
        id: ids.quotations.office,
        quotation_number: 'QT-2026-0003',
        rfq_id: ids.rfqs.furniture,
        vendor_id: ids.vendors.office,
        subtotal: '211864.50',
        gst_percentage: '18.00',
        gst_amount: '38135.61',
        grand_total: '250000.11',
        payment_terms: 'Net 15 after delivery',
        notes: 'Lowest commercial quote with full installation included.',
        status: 'selected',
        submitted_at: yesterday,
        created_at: yesterday,
        updated_at: now,
      },
    ]);

    await trx('quotation_line_items').insert([
      quoteLine('abababab-1111-4111-8111-abababababab', ids.quotations.infra, ids.rfqItems.chairs, 'Ergonomic Chairs', 100, 950, 18),
      quoteLine('abababab-2222-4222-8222-abababababab', ids.quotations.infra, ids.rfqItems.desks, 'Standing Desks', 50, 1850, 20),
      quoteLine('abababab-3333-4333-8333-abababababab', ids.quotations.infra, ids.rfqItems.cabinets, 'Storage Cabinets', 25, 1140, 18),
      quoteLine('abababab-4444-4444-8444-abababababab', ids.quotations.tech, ids.rfqItems.chairs, 'Ergonomic Chairs', 100, 980, 21),
      quoteLine('abababab-5555-4555-8555-abababababab', ids.quotations.tech, ids.rfqItems.desks, 'Standing Desks', 50, 1900, 21),
      quoteLine('abababab-6666-4666-8666-abababababab', ids.quotations.tech, ids.rfqItems.cabinets, 'Storage Cabinets', 25, 1500, 21),
      quoteLine('abababab-7777-4777-8777-abababababab', ids.quotations.office, ids.rfqItems.chairs, 'Ergonomic Chairs', 100, 900, 14),
      quoteLine('abababab-8888-4888-8888-abababababab', ids.quotations.office, ids.rfqItems.desks, 'Standing Desks', 50, 1800, 14),
      quoteLine('abababab-9999-4999-8999-abababababab', ids.quotations.office, ids.rfqItems.cabinets, 'Storage Cabinets', 25, 874.58, 14),
    ]);

    await trx('approvals').insert([
      {
        id: ids.approvals.inProgress,
        quotation_id: ids.quotations.infra,
        rfq_id: ids.rfqs.furniture,
        vendor_id: ids.vendors.infra,
        current_step: 3,
        status: 'pending',
        initiated_by: ids.users.officer,
        created_at: yesterday,
        updated_at: now,
      },
      {
        id: ids.approvals.completed,
        quotation_id: ids.quotations.office,
        rfq_id: ids.rfqs.furniture,
        vendor_id: ids.vendors.office,
        current_step: 4,
        status: 'approved',
        initiated_by: ids.users.officer,
        created_at: lastWeek,
        updated_at: yesterday,
      },
    ]);

    await trx('approval_steps').insert([
      {
        id: '34343434-1111-4111-8111-343434343434',
        approval_id: ids.approvals.inProgress,
        step_number: 2,
        step_name: 'L1 Review',
        approver_id: ids.users.rahul,
        status: 'approved',
        remarks: 'Commercials and vendor track record look acceptable.',
        acted_at: yesterday,
        assigned_at: yesterday,
      },
      {
        id: '34343434-2222-4222-8222-343434343434',
        approval_id: ids.approvals.inProgress,
        step_number: 3,
        step_name: 'L2 Approval',
        approver_id: ids.users.priya,
        status: 'pending',
        remarks: null,
        acted_at: null,
        assigned_at: now,
      },
      {
        id: '34343434-3333-4333-8333-343434343434',
        approval_id: ids.approvals.completed,
        step_number: 2,
        step_name: 'L1 Review',
        approver_id: ids.users.rahul,
        status: 'approved',
        remarks: 'Recommended due to lowest compliant price.',
        acted_at: lastWeek,
        assigned_at: lastWeek,
      },
      {
        id: '34343434-4444-4444-8444-343434343434',
        approval_id: ids.approvals.completed,
        step_number: 3,
        step_name: 'L2 Approval',
        approver_id: ids.users.priya,
        status: 'approved',
        remarks: 'Approved for PO generation.',
        acted_at: yesterday,
        assigned_at: lastWeek,
      },
    ]);

    await trx('purchase_orders').insert([
      {
        id: ids.po,
        po_number: 'PO-2026-0001',
        rfq_id: ids.rfqs.furniture,
        quotation_id: ids.quotations.office,
        vendor_id: ids.vendors.office,
        approval_id: ids.approvals.completed,
        subtotal: '211864.50',
        cgst_percentage: '9.00',
        sgst_percentage: '9.00',
        cgst_amount: '19067.81',
        sgst_amount: '19067.80',
        grand_total: '250000.11',
        po_date: '2026-06-05',
        status: 'completed',
        created_by: ids.users.officer,
        created_at: yesterday,
        updated_at: now,
      },
    ]);

    await trx('invoices').insert([
      {
        id: ids.invoice,
        invoice_number: 'INV-2026-0001',
        po_id: ids.po,
        vendor_id: ids.vendors.office,
        invoice_date: '2026-06-05',
        due_date: '2026-07-05',
        subtotal: '211864.50',
        cgst_amount: '19067.81',
        sgst_amount: '19067.80',
        grand_total: '250000.11',
        status: 'paid',
        paid_at: now,
        created_at: yesterday,
        updated_at: now,
      },
    ]);

    await trx('activity_logs').insert([
      {
        id: '45454545-1111-4111-8111-454545454545',
        entity_type: 'user',
        entity_id: ids.users.officer,
        action: 'Demo users seeded',
        performed_by: ids.users.admin,
        metadata: { count: 4 },
        created_at: lastWeek,
      },
      {
        id: '45454545-2222-4222-8222-454545454545',
        entity_type: 'vendor',
        entity_id: ids.vendors.infra,
        action: 'Vendor added: Infra Supplies Pvt Ltd',
        performed_by: ids.users.officer,
        metadata: { status: 'active', category: 'Office Furniture' },
        created_at: lastWeek,
      },
      {
        id: '45454545-3333-4333-8333-454545454545',
        entity_type: 'vendor',
        entity_id: ids.vendors.pending,
        action: 'Vendor added: GreenBuild Associates',
        performed_by: ids.users.officer,
        metadata: { status: 'pending', category: 'Facilities' },
        created_at: lastWeek,
      },
      {
        id: '45454545-4444-4444-8444-454545454545',
        entity_type: 'rfq',
        entity_id: ids.rfqs.furniture,
        action: 'RFQ created and published: Office Furniture Q2',
        performed_by: ids.users.officer,
        metadata: { rfq_number: 'RFQ-2026-0001', vendor_count: 3, item_count: 3 },
        created_at: lastWeek,
      },
      {
        id: '45454545-5555-4555-8555-454545454545',
        entity_type: 'rfq',
        entity_id: ids.rfqs.laptops,
        action: 'Draft RFQ created: Engineering Laptop Refresh',
        performed_by: ids.users.officer,
        metadata: { rfq_number: 'RFQ-2026-0002', item_count: 2 },
        created_at: now,
      },
      {
        id: '45454545-6666-4666-8666-454545454545',
        entity_type: 'quotation',
        entity_id: ids.quotations.infra,
        action: 'Quotation submitted: QT-2026-0001',
        performed_by: ids.users.officer,
        metadata: { vendor: 'Infra Supplies Pvt Ltd', grand_total: 264320 },
        created_at: yesterday,
      },
      {
        id: '45454545-7777-4777-8777-454545454545',
        entity_type: 'quotation',
        entity_id: ids.quotations.tech,
        action: 'Quotation submitted: QT-2026-0002',
        performed_by: ids.users.officer,
        metadata: { vendor: 'Tech Core LTD', grand_total: 274350 },
        created_at: yesterday,
      },
      {
        id: '45454545-8888-4888-8888-454545454545',
        entity_type: 'quotation',
        entity_id: ids.quotations.office,
        action: 'Quotation submitted: QT-2026-0003',
        performed_by: ids.users.officer,
        metadata: { vendor: 'OfficeNeed Co.', grand_total: 250000.11 },
        created_at: yesterday,
      },
      {
        id: '45454545-9999-4999-8999-454545454545',
        entity_type: 'approval',
        entity_id: ids.approvals.inProgress,
        action: 'Approval awaiting L2 review by Priya Shah',
        performed_by: ids.users.rahul,
        metadata: { current_step: 3, status: 'pending' },
        created_at: now,
      },
      {
        id: '45454545-aaaa-4aaa-8aaa-454545454545',
        entity_type: 'purchase_order',
        entity_id: ids.po,
        action: 'Purchase order created: PO-2026-0001',
        performed_by: ids.users.priya,
        metadata: { grand_total: 250000.11, vendor: 'OfficeNeed Co.' },
        created_at: yesterday,
      },
      {
        id: '45454545-bbbb-4bbb-8bbb-454545454545',
        entity_type: 'invoice',
        entity_id: ids.invoice,
        action: 'Invoice created and marked paid: INV-2026-0001',
        performed_by: ids.users.officer,
        metadata: { grand_total: 250000.11, status: 'paid' },
        created_at: now,
      },
    ]);
  });
};
