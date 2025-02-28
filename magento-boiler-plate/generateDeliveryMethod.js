const fs = require('fs');
const path = require('path');

/**
 * Generate all necessary files for a Magento 2 delivery method module.
 *
 * @param {string} vendor       - Vendor name (e.g., "Ashish")
 * @param {string} module       - Module name (e.g., "Delivery")
 * @param {string} methodCode   - Shipping method code (e.g., "deliverymethod")
 * @param {string} title        - Shipping method title (e.g., "Delivery Method")
 * @param {string} methodName   - Shipping method name (e.g., "Delivery Method")
 * @param {number} fixedPrice   - Fixed shipping price (e.g., 5.00)
 * @param {string} moduleDir    - Absolute path to the module directory
 */
function generateDeliveryMethod(vendor, module, methodCode, title, methodName, fixedPrice, moduleDir) {
    // Prepare content for registration.php
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

    // etc/di.xml – register the carrier in Magento's CarrierFactory
    const diXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">
    <type name="Magento\\Shipping\\Model\\CarrierFactory">
        <arguments>
            <argument name="carriers" xsi:type="array">
                <item name="${methodCode}" xsi:type="string">${vendor}\\${module}\\Model\\Carrier\\DeliveryMethod</item>
            </argument>
        </arguments>
    </type>
</config>
`;

    // etc/config.xml – default configuration for the shipping method
    const configXmlContent = `<?xml version="1.0"?>
<config>
    <default>
        <carriers>
            <${methodCode}>
                <active>1</active>
                <title>${title}</title>
                <name>${methodName}</name>
                <sallowspecific>0</sallowspecific>
                <sort_order>100</sort_order>
                <specificerrmsg>This shipping method is currently unavailable.</specificerrmsg>
            </${methodCode}>
        </carriers>
    </default>
</config>
`;

    // etc/adminhtml/system.xml – admin configuration UI
    const systemXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/system_file.xsd">
    <system>
        <section id="carriers" translate="label" sortOrder="100" showInDefault="1" showInWebsite="1" showInStore="1">
            <label>Shipping Methods</label>
            <tab>sales</tab>
            <resource>Magento_Backend::system</resource>
            <group id="${methodCode}" translate="label" sortOrder="100" showInDefault="1" showInWebsite="1" showInStore="1">
                <label>${title}</label>
                <field id="active" translate="label" type="select" sortOrder="1" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Enabled</label>
                    <source_model>Magento\\Config\\Model\\Config\\Source\\Yesno</source_model>
                </field>
                <field id="title" translate="label" type="text" sortOrder="2" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Title</label>
                </field>
                <field id="name" translate="label" type="text" sortOrder="3" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Method Name</label>
                </field>
                <field id="sort_order" translate="label" type="text" sortOrder="4" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Sort Order</label>
                </field>
                <field id="specificerrmsg" translate="label" type="text" sortOrder="5" showInDefault="1" showInWebsite="1" showInStore="1">
                    <label>Error Message</label>
                </field>
            </group>
        </section>
    </system>
</config>
`;

    // Model/Carrier/DeliveryMethod.php – the shipping method implementation
    const carrierPhpContent = `<?php
namespace ${vendor}\\${module}\\Model\\Carrier;

use Magento\\Quote\\Model\\Quote\\Address\\RateRequest;
use Magento\\Shipping\\Model\\Rate\\Result;
use Magento\\Shipping\\Model\\Carrier\\AbstractCarrier;
use Magento\\Shipping\\Model\\Carrier\\CarrierInterface;

class DeliveryMethod extends AbstractCarrier implements CarrierInterface
{
    protected \$_code = '${methodCode}';

    protected \$_rateResultFactory;
    protected \$_rateMethodFactory;

    public function __construct(
        \\Magento\\Framework\\App\\Config\\ScopeConfigInterface \$scopeConfig,
        \\Magento\\Quote\\Model\\Quote\\Address\\RateResult\\ErrorFactory \$rateErrorFactory,
        \\Psr\\Log\\LoggerInterface \$logger,
        \\Magento\\Shipping\\Model\\Rate\\ResultFactory \$rateResultFactory,
        \\Magento\\Quote\\Model\\Quote\\Address\\RateResult\\MethodFactory \$rateMethodFactory,
        array \$data = []
    ) {
        \$this->_rateResultFactory = \$rateResultFactory;
        \$this->_rateMethodFactory = \$rateMethodFactory;
        parent::__construct(\$scopeConfig, \$rateErrorFactory, \$logger, \$data);
    }

    /**
     * Collect and get shipping rates
     *
     * @param RateRequest \$request
     * @return Result|bool
     */
    public function collectRates(RateRequest \$request)
    {
        if (!\$this->getConfigFlag('active')) {
            return false;
        }

        \$result = \$this->_rateResultFactory->create();
        \$method = \$this->_rateMethodFactory->create();

        \$method->setCarrier(\$this->_code);
        \$method->setCarrierTitle(\$this->getConfigData('title'));

        \$method->setMethod(\$this->_code);
        \$method->setMethodTitle(\$this->getConfigData('name'));

        // Fixed shipping price.
        \$amount = ${fixedPrice.toFixed(2)};
        \$method->setPrice(\$amount);
        \$method->setCost(\$amount);

        \$result->append(\$method);
        return \$result;
    }

    /**
     * Return allowed shipping methods
     *
     * @return array
     */
    public function getAllowedMethods()
    {
        return [\$this->_code => \$this->getConfigData('name')];
    }
}
`;

    // --- Create folder structure and write files ---
    if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
    }
    // Write registration.php
    fs.writeFileSync(path.join(moduleDir, 'registration.php'), registrationContent);
    // Create etc directory and write module.xml, di.xml, config.xml
    const etcDir = path.join(moduleDir, 'etc');
    if (!fs.existsSync(etcDir)) {
        fs.mkdirSync(etcDir, { recursive: true });
    }
    fs.writeFileSync(path.join(etcDir, 'module.xml'), moduleXmlContent);
    fs.writeFileSync(path.join(etcDir, 'di.xml'), diXmlContent);
    fs.writeFileSync(path.join(etcDir, 'config.xml'), configXmlContent);
    // Create etc/adminhtml directory and write system.xml
    const adminhtmlDir = path.join(etcDir, 'adminhtml');
    if (!fs.existsSync(adminhtmlDir)) {
        fs.mkdirSync(adminhtmlDir, { recursive: true });
    }
    fs.writeFileSync(path.join(adminhtmlDir, 'system.xml'), systemXmlContent);
    // Create Model/Carrier directory and write DeliveryMethod.php
    const carrierDir = path.join(moduleDir, 'Model', 'Carrier');
    if (!fs.existsSync(carrierDir)) {
        fs.mkdirSync(carrierDir, { recursive: true });
    }
    fs.writeFileSync(path.join(carrierDir, 'DeliveryMethod.php'), carrierPhpContent);

    console.log("Shipping method module generated successfully!");
}

module.exports = { generateDeliveryMethod };
