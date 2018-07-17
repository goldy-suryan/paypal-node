const express = require('express');
const paypal = require('paypal-rest-sdk');

const app = express();

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'PAYPAL_CLIENT_ID',
    'client_secret': 'PAYPAL_CLIENT_SECRET'
});

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/failure"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "T-shirt",
                    "sku": "001",
                    "price": "10.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "10.00"
            },
            "description": "This is the payment description."
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            res.status(500).json({
                error: error
            })
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "10.00"
            }
        }]
    }

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            res.status(500).json({
                error: error
            })
        } else {
            res.status(200).json({
                message: 'Success',
                payment
            })
        }
    });
});

app.get('/failure', (req, res) => {
    res.status(400).json({
        message: 'Transaction declined'
    });
});

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error)
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: {
            message: err.message
        }
    })
})

app.listen(3000, () => {
    console.log('http://localhost:3000');
});