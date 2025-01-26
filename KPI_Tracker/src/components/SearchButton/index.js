import Search from 'antd/es/transfer/search';
import React from 'react';

const SearchButton = () => {
  const onSearch = (value, _e, info) => console.log(info?.source, value);
  return (
    <Search
      placeholder="input search text"
      allowClear
      onSearch={onSearch}
      style={{
        width: 200,
      }}
      
    />
  );
};

export default SearchButton;
