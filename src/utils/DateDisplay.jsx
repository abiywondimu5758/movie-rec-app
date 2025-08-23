/* eslint-disable react/prop-types */
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };
  
  const DateDisplay = ({ date }) => {
    const formattedDate = formatDate(date);
    return <span className="font-semibold text-xs">{formattedDate}</span>;
  };

  export default DateDisplay;