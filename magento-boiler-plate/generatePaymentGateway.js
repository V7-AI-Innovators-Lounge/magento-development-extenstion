const fs = require('fs');
const path = require('path');

/**
 * Generate all necessary files for a Magento 2 Payment Gateway module.
 *
 * @param {string} vendor       - Vendor name (e.g., "Ashish")
 * @param {string} module       - Module name (e.g., "PaymentGateway")
 * @param {string} methodCode   - Payment method code (e.g., "paymentmethod")
 * @param {string} title        - Payment method title (e.g., "Payment Method")
 * @param {number} sortOrder    - Sort order (e.g., 10)
 * @param {string} orderStatus  - Default order status (e.g., "pending")
 * @param {string} moduleDir    - Absolute path to the module directory
 */
function generatePaymentGateway(vendor, module, methodCode, title, sortOrder, orderStatus, moduleDir) {
    // registration.php
    const registrationContent = `<?php
\\Magento\\Framework\\Component\\ComponentRegistrar::register(
    \\Magento\\Framework\\Component\\ComponentRegistrar::MODULE,
    '${vendor}_${module}',
    __DIR__
);
`;

    // etc/module.xml
    const moduleXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="${vendor}_${module}" setup_version="1.0.0"/>
</config>
`;

    // etc/di.xml (placeholder – extend as needed)
    const diXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <!-- DI configuration can be extended here if needed -->
</config>
`;

    // etc/config.xml – default configuration for the payment method
    const configXmlContent = `<?xml version="1.0"?>
<config>
    <default>
        <payment>
            <${methodCode}>
                <active>1</active>
                <title>${title}</title>
                <sort_order>${sortOrder}</sort_order>
                <order_status>${orderStatus}</order_status>
            </${methodCode}>
        </payment>
    </default>
</config>
`;

    // etc/payment.xml – defines the payment method
    const paymentXmlContent = `<?xml version="1.0"?>
    <payment xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Payment:etc/payment.xsd">
        <groups>
            <group id="offline">
                <label>${title}</label>
            </group>
        </groups>
        <methods>
            <method name="${methodCode}">
                <allow_multiple_address>1</allow_multiple_address>
            </method>
        </methods>
    </payment>
    `;    

    // etc/adminhtml/system.xml – admin configuration UI for the payment method
    const systemXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/system_file.xsd">
    <system>
        <section id="payment" translate="label" sortOrder="150" showInDefault="1" showInWebsite="1" showInStore="1">
            <group id="${methodCode}" translate="label" sortOrder="10" showInDefault="1" showInWebsite="1" showInStore="1">
                <label>${title}</label>
                <field id="active" translate="label" type="select" sortOrder="1" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Enabled</label>
                    <source_model>Magento\\Config\\Model\\Config\\Source\\Yesno</source_model>
                </field>
                <field id="title" translate="label" type="text" sortOrder="2" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Title</label>
                </field>
                <field id="sort_order" translate="label" type="text" sortOrder="3" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Sort Order</label>
                </field>
                <field id="order_status" translate="label" type="text" sortOrder="4" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>New Order Status</label>
                </field>
            </group>
        </section>
    </system>
</config>
`;

    // Model/Payment/CustomPayment.php – the payment method implementation
    const paymentPhpContent = `<?php
namespace ${vendor}\\${module}\\Model\\Payment;

use Magento\\Payment\\Model\\Method\\AbstractMethod;

class CustomPayment extends AbstractMethod
{
    protected \$_code = '${methodCode}';
    protected \$_isOffline = true;

    public function isAvailable(\$quote = null)
    {
        return parent::isAvailable(\$quote);
    }
}
`;

    // Create folder structure and write files
    if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
    }
    // Write registration.php
    fs.writeFileSync(path.join(moduleDir, 'registration.php'), registrationContent);
    // Create etc directory and write module.xml, di.xml, config.xml, payment.xml
    const etcDir = path.join(moduleDir, 'etc');
    if (!fs.existsSync(etcDir)) {
        fs.mkdirSync(etcDir, { recursive: true });
    }
    fs.writeFileSync(path.join(etcDir, 'module.xml'), moduleXmlContent);
    fs.writeFileSync(path.join(etcDir, 'di.xml'), diXmlContent);
    fs.writeFileSync(path.join(etcDir, 'config.xml'), configXmlContent);
    fs.writeFileSync(path.join(etcDir, 'payment.xml'), paymentXmlContent);
    // Create etc/adminhtml directory and write system.xml
    const adminhtmlDir = path.join(etcDir, 'adminhtml');
    if (!fs.existsSync(adminhtmlDir)) {
        fs.mkdirSync(adminhtmlDir, { recursive: true });
    }
    fs.writeFileSync(path.join(adminhtmlDir, 'system.xml'), systemXmlContent);
    // Create Model/Payment directory and write CustomPayment.php
    const paymentModelDir = path.join(moduleDir, 'Model', 'Payment');
    if (!fs.existsSync(paymentModelDir)) {
        fs.mkdirSync(paymentModelDir, { recursive: true });
    }
    fs.writeFileSync(path.join(paymentModelDir, 'CustomPayment.php'), paymentPhpContent);

    console.log("Payment gateway module generated successfully!");
}

module.exports = { generatePaymentGateway };
