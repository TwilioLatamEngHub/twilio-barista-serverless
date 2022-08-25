const { getIdentityFromAddress } = require(Runtime.getFunctions()['utils/crypto'].path);
const { 
  getCustomerInformation, 
  findOrCreateCustomer,
  registerAddress,
  updateBindingSidForCustomer,
  setEventForCustomer
} = require(Runtime.getFunctions()['utils/helpers'].path);


exports.handler = async function(context, event, callback) {
  
  console.log(event);

  const { From } = event;

  const customer = getCustomerInformation(event);
  customer.identity = getIdentityFromAddress(From);
  let customerEntry = await findOrCreateCustomer(customer, context);
  if (!customerEntry.data.bindingSid) {
    const { sid } = await registerAddress(From, customer.source, context);
    customerEntry = await updateBindingSidForCustomer(customerEntry, sid, context);
    customer.bindingSid = sid;
  }

  if (
    !customerEntry.data.eventId ||
    customerEntry.data.eventExpiryDate < Date.now()
  ){
    customerEntry = await setEventForCustomer(customerEntry, event.eventId, context);
  }

  const { eventId } = customerEntry.data;
  customer.eventId = eventId;

  callback(null, customer);
};
