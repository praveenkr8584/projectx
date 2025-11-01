const DataTable = ({ data, type, columns, onEdit, onDelete, selectedItems, onSelectItem, onSelectAll }) => {
  const getHeaders = () => {
    if (columns) {
      return ['Select', ...columns.map(col => col.label)];
    }
    switch (type) {
      case 'rooms':
        return ['Select', 'Room Number', 'Type', 'Price', 'Status', 'Features', 'Actions'];
      case 'bookings':
        return ['Select', 'Customer Name', 'Email', 'Room Number', 'Check-in', 'Check-out', 'Status', 'Total Amount', 'Actions'];
      case 'services':
        return ['Select', 'Name', 'Price', 'Description', 'Actions'];
      case 'users':
        return ['Select', 'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Actions'];
      default:
        return [];
    }
  };

  const renderRow = (item) => {
    if (columns) {
      return columns.map(col => (
        <td key={col.key}>
          {col.render ? col.render(item) : item[col.key]}
        </td>
      ));
    }
    switch (type) {
      case 'rooms':
        return (
          <>
            <td>{item.roomNumber}</td>
            <td>{item.type}</td>
            <td>${item.price}</td>
            <td>{item.status}</td>
            <td>{item.features?.join(', ')}</td>
            <td>
              <button onClick={() => onEdit(item, type)}>Edit</button>
              <button onClick={() => onDelete(type, item._id)}>Delete</button>
            </td>
          </>
        );
      case 'bookings':
        return (
          <>
            <td>{item.customerName}</td>
            <td>{item.customerEmail}</td>
            <td>{item.roomNumber}</td>
            <td>{new Date(item.checkInDate).toLocaleDateString()}</td>
            <td>{new Date(item.checkOutDate).toLocaleDateString()}</td>
            <td>{item.status}</td>
            <td>${item.totalAmount}</td>
            <td>
              <button onClick={() => onEdit(item, type)}>Edit</button>
              <button onClick={() => onDelete(type, item._id)}>Delete</button>
            </td>
          </>
        );
      case 'services':
        return (
          <>
            <td>{item.name}</td>
            <td>${item.price}</td>
            <td>{item.description}</td>
            <td>
              <button onClick={() => onEdit(item, type)}>Edit</button>
              <button onClick={() => onDelete(type, item._id)}>Delete</button>
            </td>
          </>
        );
      case 'users':
        return (
          <>
            <td>{item.username}</td>
            <td>{item.fullname}</td>
            <td>{item.email}</td>
            <td>{item.phone}</td>
            <td>{item.role}</td>
            <td>
              <button onClick={() => onEdit(item, type)}>Edit</button>
              <button onClick={() => onDelete(type, item._id)}>Delete</button>
            </td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedItems?.length === data.length && data.length > 0}
              onChange={() => onSelectAll && onSelectAll(type)}
            />
          </th>
          {getHeaders().slice(1).map(header => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item._id}>
            <td>
              <input
                type="checkbox"
                checked={selectedItems?.includes(item._id)}
                onChange={() => onSelectItem && onSelectItem(type, item._id)}
              />
            </td>
            {renderRow(item)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
