import React from "react";

const PrintReceipt = React.forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;
  const itemsPerPage = 8;
  const totalItems = transaction.purchasedProducts.length;

  // Split into pages
  const pages = [];
  for (let i = 0; i < totalItems; i += itemsPerPage) {
    const slicedPage = transaction.purchasedProducts.slice(i, i + itemsPerPage);
    if (slicedPage.length > 0) pages.push(slicedPage); // Prevent blank pages
  }

  return (
    <div
      ref={ref}
      className="w-full text-black"
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "serif", // Use serif for Roman
        fontSize: "12px", // Adjust font size as needed (roughly 12 CPI)
      }}
    >
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-break pt-[7.6rem] p-6 ml-1">
          {/* Header */}
          <div className="">
            <p className="text-right pr-32 font-bold text-[24px]">
              {transaction.id}
            </p>

            {/* Customer Info */}
            <div className="grid grid-cols-2  gap-4 font-bold">
              <div className="ml-9 text-[16px]">
                <p>{transaction.customer.customerName}</p>
                <div className="ml-4">
                  <p>{transaction.customer.address}</p>
                </div>
              </div>
              <div className="text-right text-[16px]">
                <p className="pr-24">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
                <p className="pr-4 text-[14px]">
                  {transaction.customer.mobileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Products Table */}
          <div className="mt-8 pr-2">
            <table className="w-full text-xs table-fixed font-bold">
              <tbody>
                {page.map((product) => {
                  return (
                    <tr key={product.id} className="p-0 m-0">
                      <td className="text-center w-[5%] p-0">
                        {product.quantity}
                      </td>
                      <td className="text-center w-[10%] p-0">
                        {product.quantity === 1 ? "pc." : "pcs."}
                      </td>
                      <td className="pl-4 w-[50%] p-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-bold">
                            {product.pricelist.productName}
                          </span>
                          {product.serialNumbers.length > 0 && (
                            <span className="break-words whitespace-normal">
                              (
                              {product.serialNumbers
                                .map((sn) => sn.serialName)
                                .join(", ")}
                              )
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-left w-[10%] p-0">
                        ₱
                        {product.price.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-left pr-6 w-[10%] p-0">
                        ₱
                        {product.subtotal.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Amount - Only on the last page */}
          {pageIndex === pages.length - 1 && (
            <p className="fixed top-[27rem] right-12 text-right font-bold text-[16px]">
              ₱
              {transaction.totalAmount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          )}

          <div className="fixed top-[30rem] left-60 transform translate-x-[-51%] flex w-full justify-center space-x-20 font-bold">
            <div className="w-48 text-center text-[16px]">
              {transaction.preparedBy}
            </div>
            <div className="w-48 text-center text-[16px]">
              {transaction.checkedBy}
            </div>
          </div>
          {/* Page Break for Printing */}
          {pageIndex < pages.length - 1 && <div className="page-break"></div>}
        </div>
      ))}
    </div>
  );
});

export default PrintReceipt;

/* This is old version in print*/
// <div
//     ref={ref}
//     className="w-full text-black"
//     style={{
//       whiteSpace: "pre-wrap",
//       fontFamily: "serif", // Use serif for Roman
//       fontSize: "12px", // Adjust font size as needed (roughly 12 CPI)
//     }}
//   >
//     {pages.map((page, pageIndex) => (
//       <div key={pageIndex} className="page-break pt-28 p-6 ml-1">
//         {/* Header */}
//         <div className="">
//           <p className="text-right pr-32 font-bold text-[24px]">
//             {transaction.id}
//           </p>

//           {/* Customer Info */}
//           <div className="grid grid-cols-2  gap-4 font-bold">
//             <div className="ml-9 text-[16px]">
//               <p>{transaction.customer.customerName}</p>
//               <div className="ml-4">
//                 <p>{transaction.customer.address}</p>
//               </div>
//             </div>
//             <div className="text-right text-[16px]">
//               <p className="pr-24">
//                 {new Date(transaction.date).toLocaleDateString()}
//               </p>
//               <p className="pr-4 text-[14px]">
//                 {transaction.customer.mobileNumber}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Purchased Products Table */}
//         <div className="mt-8 pr-2">
//           <table className="w-full text-xs table-fixed font-bold">
//             <tbody>
//               {page.map((product) => {
//                 return (
//                   <tr key={product.id} className="p-0 m-0">
//                     <td className="text-center w-[5%] p-0">
//                       {product.quantity}
//                     </td>
//                     <td className="text-center w-[10%] p-0">
//                       {product.quantity === 1 ? "pc." : "pcs."}
//                     </td>
//                     <td className="pl-4 w-[50%] p-0">
//                       <div className="flex flex-wrap items-center gap-1">
//                         <span className="font-bold">
//                           {product.pricelist.productName}
//                         </span>
//                         {product.serialNumbers.length > 0 && (
//                           <span className="break-words whitespace-normal">
//                             (
//                             {product.serialNumbers
//                               .map((sn) => sn.serialName)
//                               .join(", ")}
//                             )
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="text-left w-[10%] p-0">
//                       ₱
//                       {product.price.toLocaleString("en-PH", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td className="text-left pr-6 w-[10%] p-0">
//                       ₱
//                       {product.subtotal.toLocaleString("en-PH", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Total Amount - Only on the last page */}
//         {pageIndex === pages.length - 1 && (
//           <p className="fixed top-[26rem] right-12 text-right font-bold text-[16px]">
//             ₱
//             {transaction.totalAmount.toLocaleString("en-PH", {
//               minimumFractionDigits: 2,
//             })}
//           </p>
//         )}

//         <div className="fixed top-[30rem] left-60 transform translate-x-[-51%] flex w-full justify-center space-x-20 font-bold">
//           <div className="w-48 text-center text-[16px]">
//             {transaction.preparedBy}
//           </div>
//           <div className="w-48 text-center text-[16px]">
//             {transaction.checkedBy}
//           </div>
//         </div>
//         {/* Page Break for Printing */}
//         {pageIndex < pages.length - 1 && <div className="page-break"></div>}
//       </div>
//     ))}
//   </div>
