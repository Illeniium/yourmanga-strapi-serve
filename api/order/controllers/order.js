'use strict';

const stripe = require('stripe')(
    'sk_test_51JHwh3Bf589fKVNPoUiwB5Ahqm41VeQ0D6yHytOaSyqZvvCfrJieaoHN2LlsWMZ34xf5G1LyThAxWnsRybOLaZPe00XYAuesZW'
);

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async create(ctx) {

        const {  tokenStripe, products, idUser, addressShipping } = ctx.request.body;

        const calcPrice = ( price, discount) => {
            if(!discount) return price;
            const discountAmount = ( price * discount) / 100;
            return (price - discountAmount).toFixed(2);
        }

        let totalPayment = 0;
        products.forEach(product => {
            totalPayment += calcPrice(product.price, product.discount) * product.quantity;
        });

        const charge = await stripe.charges.create({
            amount: totalPayment * 100,
            currency: 'mxn',
            source: tokenStripe,
            description : `ID Usuario: ${ idUser }`
        });

        const createOrder = [];

        for await (const product of products) {
            const data = {
                manga_product: product.id,
                user: idUser,
                totalPayment,
                productsPayment: calcPrice(product.price, product.discount) * product.quantity,
                quantity: product.quantity,
                idPayment: charge.id,
                addressShipping
            };

            const valiData = await strapi.entityValidator.validateEntityCreation(
                strapi.models.order, 
                data,
            );

            const entry = await strapi.query('order').create(valiData);
            createOrder.push(entry);
        }
        
        return createOrder;
    }
};
