import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

const PAGE_SIZE = 5;

export const useUserData = (searchTerm = "") => {
  const [users, setUsers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [prevDocs, setPrevDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  const fetchUsers = useCallback(
    async (direction = "initial") => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "user"),
          orderBy("createdAt", "desc"),
          ...(searchTerm
            ? [
                where("fullName", ">=", searchTerm),
                where("fullName", "<=", searchTerm + "\uf8ff"),
              ]
            : []),
          limit(PAGE_SIZE)
        );

        if (direction === "next" && lastDoc) {
          q = query(q, startAfter(lastDoc));
        } else if (direction === "prev" && prevDocs.length > 1) {
          const newPrevDocs = [...prevDocs];
          newPrevDocs.pop(); // remove current
          const previous = newPrevDocs[newPrevDocs.length - 1];
          q = query(q, startAfter(previous));
          setPrevDocs(newPrevDocs);
        }

        const snapshot = await getDocs(q);
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (direction === "next") {
          setPrevDocs((prev) => [...prev, snapshot.docs[0]]);
        }

        setUsers(fetchedUsers);
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setNoMore(snapshot.docs.length < PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    },
    [lastDoc, searchTerm, prevDocs]
  );

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  return {
    users,
    loading,
    noMore,
    fetchNext: () => fetchUsers("next"),
    fetchPrev: () => fetchUsers("prev"),
  };
};

export default useUserData;
