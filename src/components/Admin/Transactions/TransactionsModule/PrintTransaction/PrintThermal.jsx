import React from "react";

const PrintThermal = React.forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;

  return (
    <div
      ref={ref}
      style={{
        width: "203px",
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#000",
        backgroundColor: "#fff",
        padding: "6px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <strong style={{ fontSize: "12px" }}>ICHTHUS TECHNOLOGY</strong>
        <br />
        Malvar Batangas / Malabon
        <br />
        (043) 341-9524 / 0968-5729481
        <br />
        {transaction.id && <div className="">ID: {transaction.id}</div>}
        {transaction.date && (
          <div>Date: {new Date(transaction.date).toLocaleString()}</div>
        )}
        -------------------------------
        <br />
        <strong>TRANSACTION RECEIPT</strong>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: "6px" }}>
        <strong>Customer:</strong>
        <br />
        {transaction.customer.customerName && (
          <>
            {transaction.customer.customerName}
            <br />
          </>
        )}
        {transaction.customer.address && (
          <>
            {transaction.customer.address}
            <br />
          </>
        )}
        {transaction.customer.mobileNumber && (
          <>
            📞 {transaction.customer.mobileNumber}
            <br />
          </>
        )}
        {transaction.customer.tinNumber && (
          <>
            TIN: {transaction.customer.tinNumber}
            <br />
          </>
        )}
      </div>

      {/* Transaction Info */}
      <div style={{ marginBottom: "6px" }}>
        {transaction.terms && <div>Terms: {transaction.terms}</div>}
        {transaction.preparedBy && (
          <div>Prepared: {transaction.preparedBy}</div>
        )}
        {transaction.checkedBy && <div>Checked: {transaction.checkedBy}</div>}
        {transaction.paymentType && (
          <div>Payment: {transaction.paymentType}</div>
        )}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {/* Items */}
      {transaction.purchasedProducts?.length > 0 && (
        <div style={{ marginBottom: "6px" }}>
          <div className=" border-b-black">
            <strong>Items</strong>
            {transaction.purchasedProducts.map((product, index) => (
              <div key={index} style={{ marginBottom: "4px" }}>
                {product.pricelist?.productName}
                <br />
                Quantity {product.quantity}
                <br />
                Sub: {formatCurrency(product.subtotal)} | Less:{" "}
                {formatCurrency(product.discountValue)}
                {product.serialNumbers?.length > 0 && (
                  <div style={{ marginTop: "2px", paddingLeft: "6px" }}>
                    Serials:
                    {product.serialNumbers.map((serial, i) => (
                      <div key={i} style={{ fontSize: "9px" }}>
                        • {serial.serialName}
                      </div>
                    ))}
                  </div>
                )}
                <div
                  style={{ borderTop: "1px dashed #000", margin: "4px 0" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ marginBottom: "6px" }}>
        <strong>Summary</strong>
        {transaction.totalItems != null && (
          <div>Total Items: {transaction.totalItems}</div>
        )}
        {transaction.totalAmount != null && (
          <div>Gross Total: {formatCurrency(transaction.totalAmount)}</div>
        )}
        {transaction.discountAmount != null && (
          <div>Discounts: {formatCurrency(transaction.discountAmount)}</div>
        )}
        {transaction.payment != null && (
          <div>Payment: {formatCurrency(transaction.payment)}</div>
        )}
        {transaction.change != null && (
          <div>Change: {formatCurrency(transaction.change)}</div>
        )}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        Printed: {new Date().toLocaleString()}
        <br />
        <strong>THANK YOU FOR YOUR PURCHASE!</strong>
        <br />
        Please keep this as your official receipt.
      </div>
    </div>
  );
});

export default PrintThermal;
