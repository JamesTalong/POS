import React from "react";

const Playground = () => {
  return (
    <div className="">
      <label>NEW ITEM</label>
      <input type="text" id="item" />
      <button>Submit</button>
      <h1>Todo List</h1>
      <ul className="">
        <li>
          <input type="checkbox" />
          <label>NEW ITEM 1</label>
          <input type="checkbox" />
          <label>NEW ITEM 2</label>
          <input type="checkbox" />
          <label>NEW ITEM 3</label>
        </li>
      </ul>
    </div>
  );
};

export default Playground;
