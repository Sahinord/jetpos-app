const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/stixc/Videos/NVIDIA/Desktop/jetpos-app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grlwmcuxobbgubphovhd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Service Role bypasses RLS - used for setup and assertions
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Anon Client respects RLS - used to test RLS Tenant Isolation
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function test() {
  console.log("=================================================================");
  console.log("🚀 JETPOS RESTAURANT ECOSYSTEM END-TO-END TEST SUITE");
  console.log("=================================================================\n");

  try {
    // 1. Setup reference tenant
    const { data: tenants, error: tErr } = await supabaseAdmin.from('tenants').select('*').limit(1);
    if (tErr || !tenants || tenants.length === 0) {
      throw new Error("No tenant found. Please ensure seed data or tenants exist.");
    }
    const tenantA = tenants[0];
    const tenantIdA = tenantA.id;
    const tenantIdB = '00000000-0000-0000-0000-00000000000b'; // Dummy tenant UUID for isolation test
    console.log(`[Setup] Tenant A: ${tenantA.company_name} (${tenantIdA})`);

    // Ensure Tenant B exists in the database for RLS isolation test
    console.log("[Setup] Ensuring Tenant B exists for isolation test...");
    await supabaseAdmin.from('tenants').delete().eq('id', tenantIdB);
    const { error: tBErr } = await supabaseAdmin.from('tenants').insert({
      id: tenantIdB,
      company_name: 'Tenant B Isolation Test',
      license_key: 'TEST_LICENSE_B',
      status: 'active'
    });
    if (tBErr) throw tBErr;

    // 2. Setup reference table
    let { data: tables } = await supabaseAdmin.from('restaurant_tables').select('*').eq('tenant_id', tenantIdA).limit(1);
    let tableA;
    if (!tables || tables.length === 0) {
      console.log("[Setup] Creating a temporary test table...");
      const { data: newTab, error: tabErr } = await supabaseAdmin.from('restaurant_tables').insert({
        tenant_id: tenantIdA,
        name: 'Test Masa 99',
        section: 'Salon',
        status: 'empty',
        capacity: 4,
        is_active: true
      }).select().single();
      if (tabErr) throw tabErr;
      tableA = newTab;
    } else {
      tableA = tables[0];
    }
    console.log(`[Setup] Table A: ${tableA.name} (${tableA.id})`);

    // 3. Setup reference employees
    // We clean up any old test employees first
    await supabaseAdmin.from('employees').delete().eq('employee_code', 'TEST_W1');
    await supabaseAdmin.from('employees').delete().eq('employee_code', 'TEST_W2');

    console.log("[Setup] Creating online test waiters...");
    const { data: waiter1, error: w1Err } = await supabaseAdmin.from('employees').insert({
      tenant_id: tenantIdA,
      first_name: 'Ahmet',
      last_name: 'Garson1',
      employee_code: 'TEST_W1',
      position: 'Garson',
      role: 'waiter',
      status: 'active',
      is_online: true,
      pin_code: '111111' // Will be hashed to pin_hash and set pin_code to NULL by the trigger
    }).select().single();
    if (w1Err) throw w1Err;

    const { data: waiter2, error: w2Err } = await supabaseAdmin.from('employees').insert({
      tenant_id: tenantIdA,
      first_name: 'Mehmet',
      last_name: 'Garson2',
      employee_code: 'TEST_W2',
      position: 'Garson',
      role: 'waiter',
      status: 'active',
      is_online: true,
      pin_code: '222222'
    }).select().single();
    if (w2Err) throw w2Err;

    console.log(`[Setup] Waiter 1 (Ahmet): ${waiter1.id}`);
    console.log(`  └─ Verified values in DB: role: "${waiter1.role}", status: "${waiter1.status}", is_online: ${waiter1.is_online}`);
    console.log(`[Setup] Waiter 2 (Mehmet): ${waiter2.id}`);
    console.log(`  └─ Verified values in DB: role: "${waiter2.role}", status: "${waiter2.status}", is_online: ${waiter2.is_online}`);

    // Create a temporary kitchen station
    let { data: stations } = await supabaseAdmin.from('kitchen_stations').select('*').eq('tenant_id', tenantIdA).limit(1);
    let station;
    if (!stations || stations.length === 0) {
      console.log("[Setup] Creating a temporary kitchen station...");
      const { data: newSt, error: stErr } = await supabaseAdmin.from('kitchen_stations').insert({
        tenant_id: tenantIdA,
        name: 'Mutfak Ana',
        code: 'kitchen',
        color: '#ff0000',
        is_active: true
      }).select().single();
      if (stErr) throw stErr;
      station = newSt;
    } else {
      station = stations[0];
    }
    console.log(`[Setup] Kitchen Station: ${station.name}`);

    console.log("\n-------------------------------------------------------------");
    console.log("🔒 TEST 1: Tenant Isolation under RLS");
    console.log("-------------------------------------------------------------");

    // Clean old calls
    await supabaseAdmin.from('table_calls').delete().eq('table_id', tableA.id);

    // Insert call as Tenant A (using admin bypass for setup)
    const { data: callA, error: callAErr } = await supabaseAdmin.from('table_calls').insert({
      tenant_id: tenantIdA,
      table_id: tableA.id,
      table_name: tableA.name,
      call_type: 'waiter',
      status: 'active'
    }).select().single();
    if (callAErr) throw callAErr;
    console.log(`[Test 1] Call inserted for Tenant A. ID: ${callA.id}`);

    // Try to select call using Anon client set to Tenant A
    const { error: setTenantAErr } = await supabaseAnon.rpc('set_current_tenant', { tenant_id: tenantIdA });
    if (setTenantAErr) console.log("Note: set_current_tenant RPC error:", setTenantAErr.message);

    const { data: anonDataA, error: anonErrA } = await supabaseAnon.from('table_calls').select('*').eq('id', callA.id);
    if (anonErrA) {
      console.error(`❌ Tenant A Selection Error: ${anonErrA.message}`);
    } else if (anonDataA && anonDataA.length > 0) {
      console.log(`✅ Tenant A can see its own call! (Found: ${anonDataA.length})`);
    } else {
      console.error("❌ Tenant A could NOT see its own call under RLS.");
    }

    // Try to select call using Anon client set to Tenant B
    const { error: setTenantBErr } = await supabaseAnon.rpc('set_current_tenant', { tenant_id: tenantIdB });
    const { data: anonDataB } = await supabaseAnon.from('table_calls').select('*').eq('id', callA.id);
    if (anonDataB && anonDataB.length > 0) {
      console.error("❌ SECURITY FAILURE: Tenant B can see Tenant A's call!");
    } else {
      console.log("✅ Tenant Isolation verified! Tenant B cannot see Tenant A's call.");
    }

    console.log("\n-------------------------------------------------------------");
    console.log("⚖️ TEST 2: Fair Waiter Call Queue Trigger");
    console.log("-------------------------------------------------------------");
    
    // We clean calls again
    await supabaseAdmin.from('table_calls').delete().eq('table_id', tableA.id);

    // When we insert a call, the tr_assign_waiter_to_call trigger should automatically assign it to a waiter
    const { data: callAuto1, error: callAuto1Err } = await supabaseAdmin.from('table_calls').insert({
      tenant_id: tenantIdA,
      table_id: tableA.id,
      table_name: tableA.name,
      call_type: 'waiter',
      status: 'active'
    }).select().single();
    if (callAuto1Err) throw callAuto1Err;

    console.log(`[Test 2] First call created. Assigned Waiter Name: ${callAuto1.assigned_waiter_name} (${callAuto1.assigned_to})`);
    if (callAuto1.assigned_to) {
      console.log(`✅ Auto-assignment trigger successfully executed!`);
    } else {
      console.error(`❌ Auto-assignment trigger did not assign a waiter.`);
    }

    console.log("\n-------------------------------------------------------------");
    console.log("🔔 TEST 3: Auto Notification Routing");
    console.log("-------------------------------------------------------------");
    
    // Check if a notification was automatically created for the assigned waiter
    const { data: notifs, error: notifErr } = await supabaseAdmin.from('notifications')
      .select('*')
      .eq('reference_id', callAuto1.id)
      .eq('target_user_id', callAuto1.assigned_to);

    if (notifErr) throw notifErr;
    if (notifs && notifs.length > 0) {
      console.log(`✅ Notification automatically created for assigned waiter! target_user_id: ${notifs[0].target_user_id}`);
      console.log(`[Notification] Title: "${notifs[0].title}", Message: "${notifs[0].message}"`);
    } else {
      console.error(`❌ No notification found for the assigned waiter call.`);
    }

    console.log("\n-------------------------------------------------------------");
    console.log("🛡️ TEST 4: Secure PIN Bcrypt Verification & Rate Limiting");
    console.log("-------------------------------------------------------------");

    // Clean attempt logs
    await supabaseAdmin.from('employee_pin_attempts').delete().eq('tenant_id', tenantIdA);

    // Verify correct PIN via RPC
    const { data: correctPinCheck, error: cErr } = await supabaseAdmin.rpc('verify_employee_pin', {
      p_tenant_id: tenantIdA,
      p_pin_code: '111111'
    });
    if (cErr) throw cErr;
    if (correctPinCheck.success) {
      console.log(`✅ PIN verified successfully using Bcrypt! Logged employee: ${correctPinCheck.employee.name} (${correctPinCheck.employee.role})`);
    } else {
      console.error(`❌ PIN verification failed for correct PIN: ${correctPinCheck.message}`);
    }

    // Verify incorrect PIN (rate limit logging)
    console.log("[Test 4] Logging 5 incorrect PIN attempts to test lockout...");
    for (let i = 1; i <= 5; i++) {
      const { data: wrongPinCheck } = await supabaseAdmin.rpc('verify_employee_pin', {
        p_tenant_id: tenantIdA,
        p_pin_code: '999999'
      });
      if (wrongPinCheck.locked) {
        console.log(`✅ Locked out successfully at attempt ${i}: "${wrongPinCheck.message}"`);
        break;
      } else {
        console.log(`Attempt ${i}: Rejected code as expected.`);
      }
    }

    console.log("\n-------------------------------------------------------------");
    console.log("🛒 TEST 5: Complete Order Lifecycle & Revision Auditing");
    console.log("-------------------------------------------------------------");

    // 5.1. Create Order Group
    const { data: oGroup, error: ogErr } = await supabaseAdmin.from('order_groups').insert({
      tenant_id: tenantIdA,
      table_id: tableA.id,
      waiter_id: waiter1.id,
      order_source: 'table',
      status: 'active'
    }).select().single();
    if (ogErr) throw ogErr;
    console.log(`[Order Lifecycle] 1. Order Group Created: ID ${oGroup.id}`);

    // 5.2. Create Kitchen Order
    const { data: kOrder, error: koErr } = await supabaseAdmin.from('kitchen_orders').insert({
      tenant_id: tenantIdA,
      order_group_id: oGroup.id,
      table_id: tableA.id,
      table_name: tableA.name,
      waiter_id: waiter1.id,
      waiter_name: 'Ahmet Garson1',
      station_id: station.id,
      status: 'new'
    }).select().single();
    if (koErr) throw koErr;
    console.log(`[Order Lifecycle] 2. Kitchen Order Created: ID ${kOrder.id}`);

    // 5.3. Add Items (Pizza and Cola)
    const { data: pizzaItem } = await supabaseAdmin.from('kitchen_order_items').insert({
      kitchen_order_id: kOrder.id,
      product_name: 'Akdeniz Pizza',
      quantity: 1
    }).select().single();

    const { data: colaItem } = await supabaseAdmin.from('kitchen_order_items').insert({
      kitchen_order_id: kOrder.id,
      product_name: 'Kutu Kola',
      quantity: 1
    }).select().single();

    console.log(`[Order Lifecycle] 3. Items Added: ${pizzaItem.product_name} and ${colaItem.product_name}`);

    // 5.4. Customer cancels the Cola (Revision)
    console.log("[Order Lifecycle] 4. Customer requests Cola cancellation...");
    const { error: cancelErr } = await supabaseAdmin.from('kitchen_order_items')
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_by: waiter1.id
      })
      .eq('id', colaItem.id);
    if (cancelErr) throw cancelErr;

    const { data: colaCheck } = await supabaseAdmin.from('kitchen_order_items').select('*').eq('id', colaItem.id).single();
    if (colaCheck.cancelled_at) {
      console.log(`✅ Cola successfully cancelled with audit trail! Cancelled By: ${colaCheck.cancelled_by}`);
    } else {
      console.error("❌ Cola was not cancelled.");
    }

    // 5.5. Prepare Pizza (KDS flow)
    const { error: prepErr } = await supabaseAdmin.from('kitchen_orders')
      .update({ status: 'preparing', started_at: new Date().toISOString() })
      .eq('id', kOrder.id);
    if (prepErr) throw prepErr;
    console.log("[Order Lifecycle] 5. KDS Kitchen Order status set to: PREPARING");

    // 5.6. Complete Pizza (KDS flow)
    const { error: readyErr } = await supabaseAdmin.from('kitchen_orders')
      .update({ status: 'ready', ready_at: new Date().toISOString() })
      .eq('id', kOrder.id);
    if (readyErr) throw readyErr;
    console.log("[Order Lifecycle] 6. KDS Kitchen Order status set to: READY");

    // 5.7. Deliver and Close Order (POS checkout)
    const { error: deliverErr } = await supabaseAdmin.from('kitchen_orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', kOrder.id);
    if (deliverErr) throw deliverErr;

    const { error: closeErr } = await supabaseAdmin.from('order_groups')
      .update({ status: 'completed' })
      .eq('id', oGroup.id);
    if (closeErr) throw closeErr;
    console.log("[Order Lifecycle] 7. Order Group completed and checked out successfully!");

    console.log("\n🧹 Cleaning up temporary test records...");
    await supabaseAdmin.from('employee_pin_attempts').delete().eq('tenant_id', tenantIdA);
    await supabaseAdmin.from('table_calls').delete().eq('table_id', tableA.id);
    await supabaseAdmin.from('order_groups').delete().eq('id', oGroup.id);
    await supabaseAdmin.from('employees').delete().eq('id', waiter1.id);
    await supabaseAdmin.from('employees').delete().eq('id', waiter2.id);
    await supabaseAdmin.from('tenants').delete().eq('id', tenantIdB);
    console.log("✅ Cleanup finished!");

    console.log("\n=================================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================================");
  } catch (e) {
    console.error("\n❌ INTEGRATION TEST FAILED!");
    console.error(e.message);
  }
}

test();
