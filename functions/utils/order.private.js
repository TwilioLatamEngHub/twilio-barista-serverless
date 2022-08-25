async function addOrderToList(eventId, orderItem, listType, context){
    const { SYNC_SERVICE_SID } = context;
    const client = context.getTwilioClient();
    const listName = `${listType}_${eventId}`;

    const order = await client.sync.v1.services(SYNC_SERVICE_SID)
              .syncLists(listName)
              .syncListItems
              .create(orderItem)
              .catch(err => console.log(err));

    return order;


}

function createOrderItem(customer, coffeeOrder) {
    return {
      data: {
        product: coffeeOrder,
        message: coffeeOrder,
        source: customer.source,
        status: 'open',
        customer: customer.identity,
      },
    };
  }

module.exports = {
    addOrderToList,
    createOrderItem
}