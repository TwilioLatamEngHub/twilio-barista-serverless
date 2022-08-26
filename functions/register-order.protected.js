const { 
    addOrderToList,
    createOrderItem
  } = require(Runtime.getFunctions()['utils/order'].path);

const { 
    registerTagForBinding,
    updateBindingSidForCustomer
  } = require(Runtime.getFunctions()['utils/helpers'].path);

exports.handler = async function(context, event, callback) {
  
    const { coffeeOrder, eventId } = event;
    const customer = JSON.parse(event.customer);

    const { SYNC_SERVICE_SID } = context;
    const client = context.getTwilioClient();
    const orderItem = createOrderItem(customer, coffeeOrder);

    const orderEntry = await addOrderToList(eventId, orderItem, 'orderQueue', context);

    console.log(orderEntry);

    customer.openOrders.push(orderEntry.index);

    await client.sync.v1.services(SYNC_SERVICE_SID)
      .syncMaps('customers')
      .syncMapItems(customer.identity)
      .update({data: customer})
      .then(sync_map_item => console.log(sync_map_item.key))
      .catch(err => console.log(err));

    await addOrderToList(eventId, orderItem, 'allOrders', context);

    //await registerTagForBinding(customer.bindingSid, 'open-order', context);

    //await updateBindingSidForCustomer({data: customer, key: customer.identity}, sid, context);





    /*const orderEntry1 = await orderQueueList(eventId).syncListItems.create(
        createOrderItem(customer, coffeeOrder, req.body.Body)
      );
  
      customerEntry.data.openOrders.push(orderEntry.index);
      await customersMap.syncMapItems(customerEntry.key).update({
        data: customerEntry.data,
      });
  
      await allOrdersList(eventId).syncListItems.create({
        data: {
          product: coffeeOrder,
          message: req.body.Body,
          source: customer.source,
          countryCode: customer.countryCode,
        },
      });
  
      const newBindingSid = await registerOpenOrder(
        customerEntry.data.bindingSid
      );
      customerEntry = await updateBindingSidForCustomer(
        customerEntry,
        newBindingSid
      );*/
  
  
    callback(null, orderEntry);
  };