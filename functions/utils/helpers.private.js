const { getIdentityFromAddress } = require(Runtime.getFunctions()['utils/crypto'].path);
const moment = require('moment');



function getCustomerInformation({ From, To, FromCountry }) {
    if (!From || !To) {
      return null;
    }
  
    const source = From.indexOf('Messenger') !== -1 ? 'facebook' : 'sms';
    return {
      // address: From,
      openOrders: [],
      countryCode: FromCountry || 'unknown',
      contact: To,
      source,
      eventId: null,
    };
  }

  async function findOrCreateCustomer(customer, context) {
    const client = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;


    try{
        const customerEntry = await client.sync.v1.services(SYNC_SERVICE_SID)
            .syncMaps('customers')
            .syncMapItems(customer.identity)
            .fetch();

        return customerEntry;

    }

    catch(err){
        if(err.code === 20404){
            const customerEntry =  await client.sync.v1.services(SYNC_SERVICE_SID)
                .syncMaps('customers')
                .syncMapItems
                .create({key: customer.identity, data: customer});

            


            return customerEntry;
        }

        else{
            console.log(err);

            return;
        }
    }
   
  }

  async function registerAddress(address, bindingType, context){
    const identity = getIdentityFromAddress(address);
    const tag = 'interacted';
    const client = context.getTwilioClient();
    const { NOTIFY_SERVICE_SID } = context;

    const {sid }= await client.notify.v1.services(NOTIFY_SERVICE_SID)
                .bindings
                .create({
                   identity,
                   bindingType,
                   address,
                   tags: tag
                 });

    return { identity, sid};


  }

  async function updateBindingSidForCustomer(customerEntry, bindingSid, context) {
    const client = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;

    const data = Object.assign({}, customerEntry.data, {
      bindingSid,
    });

    return await client.sync.v1.services(SYNC_SERVICE_SID)
    .syncMaps('customers')
    .syncMapItems(customerEntry.key)
    .update({data});

  }

  async function setEventForCustomer(customerEntry, eventId, context) {
    const client = context.getTwilioClient();
    const { SYNC_SERVICE_SID } = context;

    const eventExpiryDate = moment()
      .add(5, 'days')
      .valueOf();
    
    const bindingSid = await registerTagForBinding(
      customerEntry.data.bindingSid,
      'event_' + eventId,
      context
    );
    const data = Object.assign({}, customerEntry.data, {
      bindingSid,
      eventId,
      eventExpiryDate,
    });
    return await client.sync.v1.services(SYNC_SERVICE_SID)
    .syncMaps('customers')
    .syncMapItems(customerEntry.key)
    .update({data});
  }

  async function registerTagForBinding(bindingSid, tag, context) {
    const client = context.getTwilioClient();
    const { NOTIFY_SERVICE_SID } = context;

    const originalBinding = await client.notify.v1.services(NOTIFY_SERVICE_SID)
        .bindings(bindingSid)
        .fetch();

    const newBindingData = {
      identity: originalBinding.identity,
      address: originalBinding.address,
      endpoint: originalBinding.endpoint,
      bindingType: originalBinding.bindingType,
    };
    newBindingData.tag = [
      ...(originalBinding.tags || []).filter(t => t !== tag),
      tag,
    ];
    const { sid } =  await client.notify.v1.services(NOTIFY_SERVICE_SID)
                .bindings
                .create(newBindingData);
    return sid;
  }

  module.exports = {
    getCustomerInformation,
    findOrCreateCustomer,
    registerAddress,
    updateBindingSidForCustomer,
    setEventForCustomer
  }