// // Custom Hook: useUsersData
// import { useEffect, useState } from "react";
// import { db } from "../firebase/config";
// import { collection, getDocs } from "firebase/firestore";

// const useUsersData = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const usersCollectionRef = collection(db, "user");
//         const snapshot = await getDocs(usersCollectionRef);
//         const usersData = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setUsers(usersData);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching users:", err);
//         setError(err);
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   return { users, loading, error };
// };

// export default useUsersData;
