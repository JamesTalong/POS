import React, { useEffect, useState } from "react";
import FAQItem from "./FAQItem";
import ManualItem from "./ManualItem";

// --- DATA FOR THE NEW USER MANUALS ---
const manualsData = [
  {
    icon: "🛒",
    title: "Complete Product Lifecycle: From Creation to Sale",
    overview:
      "This guide walks you through the entire process: creating a new product, setting its price, adding inventory, selling it through the POS, and finally, generating transaction reports.",
    steps: [
      {
        title: "Create a Product",
        location: "Products (under the main sidebar)",
        required: (
          <ul className="list-disc list-inside">
            <li>At least one Category (e.g., Category 1) must be created.</li>
            <li>Optional but recommended: A Brand must be created.</li>
          </ul>
        ),
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>Products</strong> in the sidebar.
            </li>
            <li>
              Click <strong>Add Product</strong>.
            </li>
            <li>Fill in product details (Name, Category, Brand).</li>
            <li>
              Click Save. Your product is now a base item ready for pricing.
            </li>
          </ol>
        ),
      },
      {
        title: "Set the Product Price (Pricelist)",
        location: "POS Item Setup > Pricelists",
        required: (
          <ul className="list-disc list-inside">
            <li>A product must be created (Step 1).</li>
            <li>
              A <strong>Color</strong> and a <strong>Location</strong> must be
              defined in their respective sections.
            </li>
          </ul>
        ),
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>POS Item Setup &gt; Pricelists</strong>.
            </li>
            <li>
              Click <strong>Add Pricelist Item</strong>.
            </li>
            <li>Select the Product, a Color, and a Location.</li>
            <li>Enter the selling Price.</li>
            <li>Click Save. The product is now sellable but has no stock.</li>
          </ol>
        ),
      },
      {
        title: "Add Stock (Batch Entry)",
        location: "POS Item Setup > Batches",
        required: <p>Product must exist in the Pricelist (Step 2).</p>,
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>POS Item Setup &gt; Batches</strong>.
            </li>
            <li>
              Click <strong>Add Batch</strong>.
            </li>
            <li>
              Select a Pricelist item (this links the stock to a specific
              product/color/location/price).
            </li>
            <li>Enter the Quantity and Serial Numbers (if applicable).</li>
            <li>
              Click Save. The product is now stocked and ready to be sold.
            </li>
          </ol>
        ),
      },
      {
        title: "Sell Products (POS Screen)",
        location: "POS",
        required: <p>Product must be priced (Step 2) and stocked (Step 3).</p>,
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to the <strong>POS</strong> page.
            </li>
            <li>Select the correct Branch/Location and Price Type.</li>
            <li>Search for the product, select quantity, and add to cart.</li>
            <li>Select a Customer and enter any transaction notes.</li>
            <li>
              Click <strong>Save</strong> or <strong>Save and Print</strong> to
              complete the sale.
            </li>
          </ol>
        ),
      },
      {
        title: "View and Export Transactions",
        location: "Transactions",
        required: <p>At least one sale must have been completed (Step 4).</p>,
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to the <strong>Transactions</strong> page.
            </li>
            <li>Use the filters (Date, Branch, Customer) to find sales.</li>
            <li>
              Click <strong>Export</strong> to download the report for
              accounting or management.
            </li>
          </ol>
        ),
      },
    ],
  },
  {
    icon: "🔐",
    title: "Managing Staff Access and Permissions",
    overview:
      "Control what your staff can see and do within the system. This involves creating job roles with specific permissions and then assigning those roles to your users.",
    steps: [
      {
        title: "Create a Job Role with Permissions",
        location: "User Restriction",
        required: (
          <p>
            A clear idea of what a specific job (e.g., 'Cashier', 'Inventory
            Manager') should be allowed to do.
          </p>
        ),
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>User Restriction</strong> in the sidebar.
            </li>
            <li>
              Click <strong>Add Role</strong> or edit an existing one.
            </li>
            <li>Give the role a name (e.g., "Cashier").</li>
            <li>
              Check the boxes for every sidebar menu item this role should have
              access to.
            </li>
            <li>
              Uncheck everything they should NOT see (e.g., a Cashier shouldn't
              see Inventory Cost).
            </li>
            <li>Click Save.</li>
          </ol>
        ),
      },
      {
        title: "Add a New Staff Member and Assign a Role",
        location: "Users",
        required: <p>A Job Role must be created first (Step 1).</p>,
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>Users</strong> in the sidebar.
            </li>
            <li>
              Click <strong>Add User</strong>.
            </li>
            <li>
              Fill in the staff member's details (name, username, password).
            </li>
            <li>
              From the 'Job Role' dropdown, select the role you created in Step
              1 (e.g., "Cashier").
            </li>
            <li>
              Click Save. The new user can now log in with the permissions you
              defined.
            </li>
          </ol>
        ),
      },
    ],
  },
  {
    icon: "📤",
    title: "Bulk Inventory Import using Excel",
    overview:
      "Use this powerful feature to add a large number of items, especially those with serial numbers, to your inventory at once without manual entry. The data is 'staged' for review before going live.",
    steps: [
      {
        title: "Prepare Your Excel File",
        location: "Your computer (using Microsoft Excel, Google Sheets, etc.)",
        required: (
          <p>
            An Excel file (.xlsx) with columns for Product ID, Quantity, and
            Serial Numbers (if applicable). Use the templates below.
          </p>
        ),
        actions: (
          // We wrap the original list and the new buttons in a React Fragment
          <>
            {/* Download Buttons Section */}
            <div className="my-4 flex flex-wrap gap-4">
              <a
                href="/HasSerial.xlsx" // NOTE: You must create this file and place it in your /public folder
                download="Sample_Inventory_With_Serial.xlsx"
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.086V3a1 1 0 112 0v8.086l1.293-1.379a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download Sample (with Serial)
              </a>
              <a
                href="/NoSerial.xlsx" // This links to your file in the /public folder
                download="Sample_Inventory_No_Serial.xlsx"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.086V3a1 1 0 112 0v8.086l1.293-1.379a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download Sample (No Serial)
              </a>
            </div>

            {/* Original numbered list */}
            <ol className="list-decimal list-inside">
              <li>
                Download the appropriate sample file above to see the required
                format.
              </li>
              <li>
                Create a spreadsheet with the required data for your inventory.
              </li>
              <li>Ensure column headers match the sample file exactly.</li>
              <li>Save the file in a location you can easily access.</li>
            </ol>
          </>
        ),
      },
      {
        title: "Upload the File to Inventory Staging",
        location: "InventoryStaging",
        required: <p>Your prepared Excel file from Step 1.</p>,
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Go to <strong>InventoryStaging</strong> in the sidebar.
            </li>
            <li>
              Click the <strong>Upload Excel</strong> button.
            </li>
            <li>Select your file and upload it.</li>
            <li>
              The system will process the file and display its contents in a
              temporary 'staging' area.
            </li>
          </ol>
        ),
      },
      {
        title: "Review and Merge to Main Inventory",
        location: "InventoryStaging",
        required: (
          <p>
            Data must be successfully uploaded and visible in the staging table.
          </p>
        ),
        actions: (
          <ol className="list-decimal list-inside">
            <li>
              Carefully review the data on the screen for any errors or typos.
            </li>
            <li>
              If everything looks correct, click the{" "}
              <strong>Merge to Inventory</strong> button.
            </li>
            <li>
              This will permanently add the staged items to your main inventory.
            </li>
          </ol>
        ),
      },
    ],
  },
];

// --- DATA FOR THE EXISTING FAQs (NO CHANGES NEEDED HERE) ---
const faqData = [
  // ... (paste your entire existing faqData array here)
  {
    icon: "⚠️",
    title: "Batangas API Issue",
    question: 'How to Resolve "Fetch Failed - Batangas API Expired" Issue?',
    answer: (
      <>
        <p className="mb-2">
          The API fetch failed due to the expiration of the database user
          credentials.
        </p>
        <p className="mb-2">
          The expired user is:
          <br />
          <strong>User ID:</strong> james
          <br />
          <strong>Password:</strong> admindb123#
        </p>
        <p className="mb-2">
          This affects both the API connection and the SQL login.
        </p>
        <h4 className="font-bold mt-3 mb-1">✅ Steps to Fix:</h4>
        <ol className="list-decimal list-inside ml-4">
          <li>
            <strong>Step 1:</strong> Remotely access the computer
            <br />
            <strong>IP Address:</strong> 192.168.10.222
          </li>
          <li>
            <strong>Step 2:</strong> Open SQL Server Management Studio (SSMS) or
            your preferred SQL client.
          </li>
          <li>
            <strong>Step 3:</strong> Reset the expired SQL user credentials
            <br />
            Update the password for user <strong>james</strong> to:{" "}
            <strong>admindb123#</strong>
            <br />
            Make sure the user account is enabled and not locked or expired.
          </li>
        </ol>
      </>
    ),
    id: "batangas-api-issue",
  },
  {
    icon: "📊",
    title: "Dashboard",
    question: "What is this page for?",
    answer:
      "This is the main summary page. It shows key reports, sales charts, and other important real-time activities from your Point of Sale (POS).",
    id: "dashboard",
  },
  {
    icon: "👥",
    title: "Staff Access: Users",
    question: "Who are these users? Can I see my customers here?",
    answer:
      "No, this section is only for your staff (employees, admins) who need to log in to the system. You can add new staff, remove old ones, and manage their login details here.",
    id: "staff-users",
  },
  {
    icon: "🔒",
    title: "Staff Access: User Permissions",
    question: "Why can't some of my staff see certain pages?",
    answer:
      'This page controls what each "Job Role" is allowed to see and do. For example, you can restrict cashiers from accessing financial reports or product setup pages.',
    id: "user-permissions",
  },
  {
    icon: "📦",
    title: "Product Setup (Dropdown)",
    question: "What are Categories 1-5 and Brands for? Which one should I use?",
    answer:
      'These are for organizing your products. Think of them as filters or labels. You only need to use the ones that make sense for your business. For example, Category 1 could be "Electronics" and Category 2 could be "Smartphones".',
    tip: "This is not for creating the actual sellable product. This is just for creating the groups that your products will belong to.",
    id: "product-setup-dropdown",
  },
  {
    icon: "📝",
    title: "Product Setup: Stock Entry (Batches)",
    question: "How do I add new inventory or update stock levels?",
    answer:
      'You do it here. A "Batch" is a group of stock you are adding to your inventory. For example, adding "100 units of Coca-Cola" would be done by creating a new batch.',
    id: "stock-entry-batches",
  },
  {
    icon: "🏷️",
    title: "Product Setup: Pricelists",
    question: "Where do I set up the items that will appear on my POS screen?",
    answer:
      'Right here. The "Pricelist" is the final list of products with their selling prices that your cashier will see on the POS screen. This is where you connect a product to a price.',
    id: "pricelists",
  },
  {
    icon: "💰",
    title: "Inventory: Cost of Goods",
    question: "Is this the selling price of my products?",
    answer:
      'No, this shows the "cost price" – how much you paid to acquire the items. This is essential for calculating your actual profit margins.',
    id: "cost-of-goods",
  },
  {
    icon: "🚚",
    title: "Inventory: Item Transfers",
    question: 'What does "Transfer Items" mean?',
    answer:
      "This is for moving inventory from one location to another (e.g., from your main warehouse to a specific store branch). A complete history of all transfers is recorded here.",
    id: "item-transfers",
  },
  {
    icon: "🔢",
    title: "Inventory: SerialNumbers",
    question: "What does this page show?",
    answer:
      "This page lets you view and track unique serial numbers for specific items, which is critical for products like electronics, phones, or high-value goods that require warranty tracking.",
    id: "serial-numbers",
  },
  {
    icon: "📈",
    title: "Inventory (Main)",
    question: "Is this where I update my stock quantities?",
    answer:
      "No. This page is for viewing your current inventory levels. It shows you how many items are sold, unsold, and the total stock on hand.",
    tip: 'To add new stock, use "Stock Entry (Batches)" for regular entries or "Upload Excel Inventory" for large, bulk uploads.',
    id: "inventory-main",
  },
  {
    icon: "📤",
    title: "Inventory: Upload Excel Inventory",
    question: "What is this for? Do I need it?",
    answer:
      'This is a powerful tool for adding a large number of inventory items (especially those with serial numbers) at once from a spreadsheet. The data is "staged" for you to review before it goes live in your inventory.',
    id: "upload-excel-inventory",
  },
  {
    icon: "🎨",
    title: "Colors / Locations / Products",
    question: "Why would the same product be priced differently?",
    answer:
      'This setup allows for price variations. For example, a "Large T-Shirt" might cost more if it\'s "Red" (Color) or if it\'s sold at your "Premium Mall" branch (Location). The "Products" page is where you define the base item before adding these variations.',
    id: "colors-locations-products",
  },
  {
    icon: "🧑",
    title: "Customers",
    question: "Is this my list of sales contacts?",
    answer:
      "Yes. This is the master list of all your customers. You can add new customers, edit their details, or view their purchase history from here.",
    id: "customers",
  },
  {
    icon: "🧾",
    title: "Transactions",
    question: "What is the difference between this and the POS page?",
    answer:
      "This page is your sales history. It shows a complete list of all past purchase transactions. The POS page is where you create new transactions.",
    id: "transactions",
  },
  {
    icon: "💻",
    title: "POS (Point of Sale)",
    question: "What does this screen do?",
    answer:
      "This is the main event! The POS screen is the virtual cash register where your staff will select items, process payments, and complete sales with customers.",
    id: "pos",
  },
];

const HelpFAQ = ({ openItemId }) => {
  const [activeTab, setActiveTab] = useState("manuals"); // <-- New state for tabs
  const [openFAQId, setOpenFAQId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (openItemId) {
      setActiveTab("faqs"); // Switch to FAQ tab if a specific FAQ is requested
      setOpenFAQId(openItemId);
      setTimeout(() => {
        // Use timeout to ensure the element is rendered
        const element = document.getElementById(`faq-item-${openItemId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [openItemId]);

  const toggleFAQ = (id) => {
    setOpenFAQId(openFAQId === id ? null : id);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFaqs = filteredFaqs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 min-h-full">
      <div className="w-full bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800">Help Center</h1>
          <p className="text-lg text-gray-500 mt-2">
            Step-by-step guides and answers to common questions.
          </p>
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("manuals")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "manuals"
                ? "border-b-4 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            User Manuals
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`py-3 px-6 text-lg font-semibold transition-colors duration-300 ${
              activeTab === "faqs"
                ? "border-b-4 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            Frequently Asked Questions (FAQ)
          </button>
        </div>

        {/* --- CONDITIONAL CONTENT --- */}
        {activeTab === "manuals" && (
          <div>
            {manualsData.map((manual, index) => (
              <ManualItem
                key={index}
                icon={manual.icon}
                title={manual.title}
                overview={manual.overview}
                steps={manual.steps}
              />
            ))}
          </div>
        )}

        {activeTab === "faqs" && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search FAQs by question or title..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* FAQ Items */}
            {currentFaqs.length > 0 ? (
              currentFaqs.map((item) => (
                <FAQItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  title={item.title}
                  question={item.question}
                  answer={item.answer}
                  tip={item.tip}
                  isOpen={openFAQId === item.id}
                  onToggle={() => toggleFAQ(item.id)}
                />
              ))
            ) : (
              <p className="text-center text-gray-600 text-lg py-8">
                No FAQs found matching your search.
              </p>
            )}

            {/* Pagination */}
            {filteredFaqs.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === index + 1
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpFAQ;
