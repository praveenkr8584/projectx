const Joi = require('joi');

const userValidationSchema = Joi.object({
    username: Joi.string().min(3).required(),
    fullname: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/)).required(),
    aadharno: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/)).required(),
    role: Joi.string().valid('customer', 'admin').default('customer')
});

const roomValidationSchema = Joi.object({
    roomNumber: Joi.string().required(),
    type: Joi.string().required(),
    price: Joi.number().min(0).required(),
    status: Joi.string().required(),
    features: Joi.array().items(Joi.string())
});

const bookingValidationSchema = Joi.object({
    customerName: Joi.string().required(),
    customerEmail: Joi.string().email().required(),
    roomNumber: Joi.string().required(),
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required(),
    status: Joi.string().required(),
    totalAmount: Joi.number().min(0).required()
});

const serviceValidationSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().required()
});

module.exports = {
    userValidationSchema,
    roomValidationSchema,
    bookingValidationSchema,
    serviceValidationSchema
};
